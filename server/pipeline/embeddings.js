/**
 * Embedding utility — loads all-MiniLM-L6-v2 via @xenova/transformers.
 * Computes feature anchor embeddings once at startup, caches in memory.
 * Exposes embed() for per-review embedding and cosineSimilarity() for comparison.
 */

let pipeline = null;
let embedder = null;
const anchorEmbeddings = {};

const FEATURE_ANCHORS = {
  battery_life:     'battery life, charging speed, how long the battery lasts',
  packaging:        'box, packaging, unboxing, damaged box, packaging quality',
  build_quality:    'build quality, durability, materials, feels cheap, solid construction',
  customer_support: 'customer support, after-sales service, helpdesk, return process',
  delivery_speed:   'delivery speed, shipping time, arrived late, fast delivery',
  value_for_money:  'value for money, price, worth the cost, expensive, affordable',
  performance:      'performance, speed, lag, response time, processing power',
};

/** Legacy export — detection now uses top-score + relative band (see detectFeatures). */
const FEATURE_THRESHOLD = 0.40;

/** Minimum cosine similarity for the strongest anchor match (embedding-only path). */
const MIN_TOP_SIMILARITY = 0.32;
/** Include additional anchors within this margin of the top score (multi-label reviews). */
const RELATIVE_BAND = 0.20;
const MAX_DETECTED_FEATURES = 6;

/** When keyword merge is empty, still attach top-N weak embedding hits for charts/graph fill. */
const SOFT_MIN_SIM = 0.26;
const SOFT_MAX_FEATURES = 3;

async function initialize() {
  if (embedder) return;

  // Dynamic import for ESM module
  const { pipeline: tfPipeline } = await import('@xenova/transformers');
  pipeline = tfPipeline;
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Pre-compute anchor embeddings
  for (const [feature, text] of Object.entries(FEATURE_ANCHORS)) {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    anchorEmbeddings[feature] = Array.from(output.data);
  }

  console.log(`[Embeddings] Cached ${Object.keys(anchorEmbeddings).length} feature anchors`);
}

async function embed(text) {
  if (!embedder) {
    throw new Error('Embedding model not initialized. Call initialize() first.');
  }
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Competitive feature detection: score all anchors, keep the best match(es) in a tight band.
 * A single low global threshold caused many reviews to spuriously match `battery_life` first
 * (generic product language sitting close to that anchor in embedding space).
 */
function detectFeatures(reviewEmbedding) {
  const scored = [];
  for (const [feature, anchorEmb] of Object.entries(anchorEmbeddings)) {
    const sim = cosineSimilarity(reviewEmbedding, anchorEmb);
    scored.push({ feature, sim });
  }
  scored.sort((a, b) => b.sim - a.sim);

  const topSim = scored[0]?.sim ?? 0;
  if (topSim < MIN_TOP_SIMILARITY) {
    return {};
  }

  const floor = Math.max(MIN_TOP_SIMILARITY * 0.92, topSim - RELATIVE_BAND);
  const matches = {};
  let n = 0;
  for (const { feature, sim } of scored) {
    if (sim < floor) break;
    if (n >= MAX_DETECTED_FEATURES) break;
    matches[feature] = { similarity: sim };
    n++;
  }
  return matches;
}

/**
 * Fallback: always take a few strongest anchors so sparse reviews still populate dashboards.
 */
function softTopFeatures(reviewEmbedding) {
  const scored = [];
  for (const [feature, anchorEmb] of Object.entries(anchorEmbeddings)) {
    const sim = cosineSimilarity(reviewEmbedding, anchorEmb);
    scored.push({ feature, sim });
  }
  scored.sort((a, b) => b.sim - a.sim);
  const matches = {};
  for (let i = 0; i < Math.min(SOFT_MAX_FEATURES, scored.length); i++) {
    if (scored[i].sim < SOFT_MIN_SIM) break;
    matches[scored[i].feature] = { similarity: scored[i].sim };
  }
  return matches;
}

function getAnchorEmbeddings() {
  return anchorEmbeddings;
}

function getFeatureAnchors() {
  return FEATURE_ANCHORS;
}

module.exports = {
  initialize,
  embed,
  cosineSimilarity,
  detectFeatures,
  softTopFeatures,
  getAnchorEmbeddings,
  getFeatureAnchors,
  FEATURE_THRESHOLD,
};
