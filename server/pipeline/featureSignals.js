/**
 * Lexical + regex feature signals (merged with embedding scores in extract.js).
 * Guarantees diverse topic coverage where MiniLM cosine similarity collapses onto one anchor.
 */

/** Score used when a keyword rule fires — chosen to sit in the same scale as cosine sim (~0.35–0.65). */
const KEYWORD_BASE_SCORE = 0.58;

/**
 * Case-insensitive patterns per feature. Any match tags the review for that feature.
 * Kept broad for noisy / multilingual retail text.
 */
const FEATURE_PATTERNS = {
  performance: [
    /\b(lag|lags|laggy|stutter|fps|hz|hertz|refresh|latency|input lag|ghosting|frame)\b/i,
    /\b(performance|snappy|responsive|smooth|speed|fast|slow)\b/i,
    /\b(gaming|gameplay|graphics|gpu|cpu)\b/i,
    /\b(anc|noise cancel|sound quality|audio driver)\b/i,
  ],
  battery_life: [
    /\b(battery|charging|charger|usb[\s-]?c|mah|hours?\s+(on|of)|drain|backup|power)\b/i,
    /\b(dies|die\s+fast|lasts?\s+(long|short)|charge\s+speed)\b/i,
  ],
  packaging: [
    /\b(packaging|unbox|box|carton|outer\s+box|sealed|bubble|wrap)\b/i,
    /\b(crushed\s+box|damaged\s+box|torn\s+box)\b/i,
  ],
  build_quality: [
    /\b(build|durability|plastic|metal|hinge|sturdy|flimsy|solid|premium\s+feel|scratch)\b/i,
    /\b(quality|construction|materials?|cheap\s+feel|well\s+built)\b/i,
  ],
  customer_support: [
    /\b(support|service|warranty|helpline|customer\s+care|refund|replacement|rma)\b/i,
    /\b(response\s*time|ticket|after[\s-]?sales)\b/i,
  ],
  delivery_speed: [
    /\b(deliver(y|ed|ies)?|shipping|shipped|courier|dispatch|arrived|late|early|on\s*time)\b/i,
    /\b(tracking|logistics|fedex|dtdc|bluedart|ekart)\b/i,
  ],
  value_for_money: [
    /\b(price|priced|cost|costly|cheap|expensive|affordable|deal|worth|value|mrp|discount)\b/i,
    /\b(overpriced|bang\s+for|money|budget|steal|rip[\s-]?off)\b/i,
    /\b(sasta|mehnga|mehenga|kimat)\b/i,
  ],
};

/** Extra regex per product_id — nudges domain vocabulary into the right feature buckets. */
const PRODUCT_HINTS = {
  prod_001: [
    [/\b(earbuds?|tws|earphones?|buds?|anc)\b/i, 'performance'],
    [/\b(case|charging case|ear\s*tip)\b/i, 'build_quality'],
  ],
  prod_002: [
    [/\b(fridge|refrigerator|cooling|compressor|freezer|ice)\b/i, 'performance'],
    [/\b(door|shelves?|storage)\b/i, 'build_quality'],
  ],
  prod_003: [
    [/\b(controller|gamepad|thumbstick|joystick|drift|trigger)\b/i, 'performance'],
    [/\b(hall effect|rgb|vibration)\b/i, 'build_quality'],
  ],
  prod_004: [
    [/\b(monitor|screen|display|panel|ips|bezel|hdr|ghosting)\b/i, 'performance'],
    [/\b(stand|vesa|mount)\b/i, 'build_quality'],
  ],
};

function detectKeywordFeatures(text, productId) {
  if (!text || typeof text !== 'string') return {};
  const lower = text.toLowerCase();
  const matches = {};

  for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
    for (const re of patterns) {
      re.lastIndex = 0;
      if (re.test(lower)) {
        matches[feature] = { similarity: KEYWORD_BASE_SCORE, source: 'keyword' };
        break;
      }
    }
  }

  const hints = PRODUCT_HINTS[productId];
  if (hints) {
    for (const [re, feat] of hints) {
      re.lastIndex = 0;
      if (re.test(lower)) {
        const prev = matches[feat]?.similarity ?? 0;
        matches[feat] = { similarity: Math.max(prev, KEYWORD_BASE_SCORE + 0.02), source: 'product_hint' };
      }
    }
  }

  return matches;
}

/**
 * Merge embedding + keyword matches; take max similarity per feature.
 * Sort keys by similarity descending for stable ordering.
 */
function mergeFeatureMatches(embeddingMatches, keywordMatches, maxFeatures = 6) {
  const keys = new Set([
    ...Object.keys(embeddingMatches || {}),
    ...Object.keys(keywordMatches || {}),
  ]);
  const merged = {};
  for (const feature of keys) {
    const e = embeddingMatches[feature]?.similarity ?? 0;
    const k = keywordMatches[feature]?.similarity ?? 0;
    const sim = Math.max(e, k);
    if (sim <= 0) continue;
    merged[feature] = {
      similarity: sim,
      keywordBoosted: k > e && keywordMatches[feature],
    };
  }
  const sortedEntries = Object.entries(merged).sort((a, b) => b[1].similarity - a[1].similarity);
  const out = {};
  let n = 0;
  for (const [f, meta] of sortedEntries) {
    if (n >= maxFeatures) break;
    out[f] = { similarity: meta.similarity };
    n++;
  }
  return out;
}

module.exports = {
  detectKeywordFeatures,
  mergeFeatureMatches,
  KEYWORD_BASE_SCORE,
};
