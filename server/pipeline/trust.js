/**
 * Stage 2 — Trust Filter
 * Exact dedup (hash), near-duplicate (cosine > 0.92), bot/spam heuristics.
 */
const crypto = require('crypto');
const { Review } = require('../models');
const embeddings = require('./embeddings');

async function trustFilter(reviewData) {
  const text = reviewData.normalized_text || reviewData.review_text || '';

  // 1. Exact dedup via hash
  const hash = crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
  const existingHash = await Review.findOne({
    where: { text_hash: hash, status: 'processed' },
  });
  if (existingHash) {
    return { pass: false, reason: 'Exact duplicate detected', hash };
  }

  // 2. Near-duplicate via cosine similarity
  try {
    const reviewEmbedding = await embeddings.embed(text);
    const recentReviews = await Review.findAll({
      where: { product_id: reviewData.product_id, status: 'processed' },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    for (const existing of recentReviews) {
      if (!existing.embedding) continue;
      const existingEmb = JSON.parse(existing.embedding);
      const sim = embeddings.cosineSimilarity(reviewEmbedding, existingEmb);
      if (sim > 0.92) {
        return { pass: false, reason: `Near-duplicate (similarity: ${sim.toFixed(3)})`, hash, embedding: reviewEmbedding };
      }
    }

    // 3. Bot/spam heuristics
    const spamResult = checkSpam(reviewData, text);
    if (!spamResult.pass) {
      return { ...spamResult, hash, embedding: reviewEmbedding };
    }

    return { pass: true, reason: null, hash, embedding: reviewEmbedding };
  } catch (err) {
    console.warn(`[Stage 2] Embedding check failed, passing through: ${err.message}`);
    return { pass: true, reason: null, hash, embedding: null };
  }
}

function checkSpam(reviewData, text) {
  const t = text.trim();

  // Generic phrasing patterns
  const genericPatterns = [
    /^(good|nice|bad|ok|okay|fine|great|excellent|worst|best)\.?$/i,
    /^(love it|hate it|amazing|terrible|awesome|horrible)\.?$/i,
  ];
  for (const pattern of genericPatterns) {
    if (pattern.test(t)) {
      return { pass: false, reason: 'Generic/low-effort review' };
    }
  }

  // Obvious bot / template spam (repeated marketing blocks, seller shill phrasing)
  const botPatterns = [
    /amazing product.{0,80}five star quality.{0,80}fast shipping.{0,80}highly recommend seller/i,
    /\b(best price guaranteed|100% genuine product|verified buyer promo|click here to buy)\b/i,
    /\b(five star|5\s*star).{0,40}(fast shipping|quick delivery).{0,40}(highly recommend|seller is best)\b/i,
    /^(?:⭐\s*){3,}\s*(great|amazing|best)/i,
    /\bauthentic product\b.*\bfast delivery\b.*\bhighly recommend\b.*\bseller\b/i,
  ];
  for (const pattern of botPatterns) {
    if (pattern.test(t)) {
      return { pass: false, reason: 'Bot/template review pattern detected' };
    }
  }

  // Very short reviews (< 3 words)
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 3) {
    return { pass: false, reason: 'Review too short (< 3 words)' };
  }

  // Rating anomaly: 5-star with very negative text or 1-star with very positive
  // (basic heuristic — just flag extreme cases)

  return { pass: true, reason: null };
}

module.exports = { process: trustFilter };
