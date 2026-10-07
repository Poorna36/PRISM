/**
 * Load all reviews from simulation/reviews-data.js (same data as browser simulation),
 * insert into DB, and run the full pipeline on each.
 *
 * Usage (from server/):
 *   node bulk-ingest.js           # append to existing data (may duplicate)
 *   node bulk-ingest.js --fresh   # wipe reviews + graph + insights + alerts, then ingest
 *
 * npm: npm run ingest:all  |  npm run ingest:all:fresh
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { v4: uuidv4 } = require('uuid');

const sequelize = require('./config/db');
const { Review, GraphNode, GraphEdge, Insight, Alert } = require('./models');
const embeddings = require('./pipeline/embeddings');
const runPipeline = require('./pipeline');

function loadSeedReviews() {
  const file = path.join(__dirname, '..', 'simulation', 'reviews-data.js');
  const code = fs.readFileSync(file, 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const list = ctx.window.REVIEWS_DATA;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('REVIEWS_DATA empty — check simulation/reviews-data.js');
  }
  return list;
}

async function wipeAll() {
  console.log('[ingest] Wiping graph, insights, alerts, reviews…');
  await GraphEdge.destroy({ where: {} });
  await GraphNode.destroy({ where: {} });
  await Insight.destroy({ where: {} });
  await Alert.destroy({ where: {} });
  await Review.destroy({ where: {} });
  console.log('[ingest] Tables cleared.');
}

async function main() {
  const fresh = process.argv.includes('--fresh');
  let rows = loadSeedReviews();
  const limit = process.env.INGEST_LIMIT ? parseInt(process.env.INGEST_LIMIT, 10) : 0;
  if (limit > 0) {
    rows = rows.slice(0, limit);
    console.log(`[ingest] INGEST_LIMIT=${limit} — truncated list`);
  }
  console.log(`[ingest] Loaded ${rows.length} seed reviews from simulation/reviews-data.js`);

  await sequelize.authenticate();
  console.log('[ingest] Loading embedding model (one-time)…');
  await embeddings.initialize();

  if (fresh) {
    await wipeAll();
  }

  let ok = 0;
  let fail = 0;
  const total = rows.length;
  const t0 = Date.now();

  const normalize = require('./pipeline/normalize');
  const trust = require('./pipeline/trust');
  const extract = require('./pipeline/extract');
  const graph = require('./pipeline/graph');
  const timeseries = require('./pipeline/timeseries');
  const confidence = require('./pipeline/confidence');
  const { warmAll } = require('./utils/dashboardCache');

  const productsSeen = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const text = row.review_text || row.transcript;
    if (!text || !String(text).trim()) {
      fail++;
      continue;
    }

    try {
      productsSeen.add(row.product_id);
      const reviewId = uuidv4();
      const reviewObj = {
        id: reviewId,
        product_id: row.product_id,
        platform: row.platform,
        review_text: row.review_text || null,
        transcript: row.transcript || null,
        rating: row.rating,
        user_id: row.user_id,
        media_type: row.media_type || 'none',
        timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
        status: 'queued',
      };

      // Stage 1: Normalize
      const norm = await normalize.process(reviewObj);
      reviewObj.normalized_text = norm.normalized_text;
      reviewObj.detected_language = norm.detected_language;

      // Stage 2: Trust Filter
      const trustRes = await trust.process(reviewObj);
      reviewObj.text_hash = trustRes.hash;

      if (!trustRes.pass) {
        reviewObj.status = 'flagged';
        reviewObj.flag_reason = trustRes.reason;
        await Review.create(reviewObj);
        ok++;
        continue;
      }

      // Stage 3: Feature Extraction & Sentiment
      const extractRes = await extract.process(norm.normalized_text, row.rating, row.product_id);
      reviewObj.features = JSON.stringify(extractRes.features);
      reviewObj.embedding = extractRes.embedding ? JSON.stringify(extractRes.embedding) : null;
      reviewObj.status = 'processed';

      const createdReview = await Review.create(reviewObj);

      // Create GraphNode
      const weekStr = graph.getWeekString ? graph.getWeekString(reviewObj.timestamp) : new Date(reviewObj.timestamp).toISOString().slice(0, 10);
      const featKeys = Object.keys(extractRes.features || {});
      const sentiments = {};
      for (const [f, d] of Object.entries(extractRes.features || {})) sentiments[f] = d.sentiment;

      await GraphNode.create({
        id: uuidv4(),
        review_id: createdReview.id,
        product_id: row.product_id,
        platform: row.platform,
        features: JSON.stringify(featKeys),
        sentiments: JSON.stringify(sentiments),
        week: weekStr,
        embedding: extractRes.embedding ? JSON.stringify(extractRes.embedding) : null,
      });

      ok++;
    } catch (err) {
      console.warn(`[ingest] row ${i} failed:`, err.message);
      fail++;
    }

    if ((i + 1) % 100 === 0 || i + 1 === total) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[ingest] Ingested ${i + 1}/${total} reviews (${ok} ok, ${fail} skipped/fail) — ${elapsed}s`);
    }
  }

  console.log(`\n[ingest] Building Graph Edges, Clusters, Time-Series & Confidence for products: ${Array.from(productsSeen).join(', ')}...`);
  for (const pid of productsSeen) {
    try {
      const edgeCount = await graph.buildAllEdges(pid);
      console.log(`  ✓ Created ${edgeCount} graph edges & classified clusters for ${pid}`);
      await timeseries.process(pid);
      await confidence.process(pid);
      console.log(`  ✓ Time-series & confidence analysis complete for ${pid}`);
    } catch (e) {
      console.warn(`  ✗ Analysis error for ${pid}:`, e.message);
    }
  }

  console.log('[ingest] Warming dashboard cache...');
  await warmAll();
  console.log(`[ingest] All done in ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
