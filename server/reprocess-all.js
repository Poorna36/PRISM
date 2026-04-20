/**
 * One-shot: rebuild graph + insights from existing processed reviews using the latest
 * hybrid feature extractor. Run from server/:  node reprocess-all.js
 */
require('dotenv').config();

const { Review, GraphNode, GraphEdge, Insight, Alert } = require('./models');
const embeddings = require('./pipeline/embeddings');
const extract = require('./pipeline/extract');
const graph = require('./pipeline/graph');
const timeseries = require('./pipeline/timeseries');
const confidence = require('./pipeline/confidence');

async function main() {
  console.log('[Reprocess] Loading embedding model…');
  await embeddings.initialize();

  console.log('[Reprocess] Clearing graph, insights, alerts…');
  await GraphEdge.destroy({ where: {} });
  await GraphNode.destroy({ where: {} });
  await Insight.destroy({ where: {} });
  await Alert.destroy({ where: {} });

  const reviews = await Review.findAll({
    where: { status: 'processed' },
    order: [['timestamp', 'ASC']],
  });

  console.log(`[Reprocess] Replaying ${reviews.length} reviews through Stage 3–4…`);
  const products = new Set();

  for (const r of reviews) {
    const text = r.normalized_text || r.review_text || '';
    if (!text.trim()) continue;
    try {
      const ex = await extract.process(text, r.rating, r.product_id);
      await r.update({
        features: JSON.stringify(ex.features),
        embedding: ex.embedding ? JSON.stringify(ex.embedding) : null,
      });
      await graph.process(r.toJSON(), ex);
      products.add(r.product_id);
    } catch (err) {
      console.warn(`[Reprocess] skip ${r.id}:`, err.message);
    }
  }

  for (const productId of products) {
    await timeseries.process(productId);
    await confidence.process(productId);
    console.log(`[Reprocess] Timeseries + confidence for ${productId}`);
  }

  console.log('[Reprocess] Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
