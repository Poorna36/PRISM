/**
 * Pipeline Orchestrator
 * Runs all 7 stages sequentially on a review by ID.
 * Called asynchronously after review ingestion.
 */
const { Review } = require('../models');
const { Alert } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { emitAlert } = require('../utils/socket');

const normalize = require('./normalize');
const trust = require('./trust');
const extract = require('./extract');
const graph = require('./graph');
const timeseries = require('./timeseries');
const confidence = require('./confidence');
const feedback = require('./feedback');

async function runPipeline(reviewId) {
  const review = await Review.findByPk(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  console.log(`[Pipeline] Starting for review ${reviewId}`);
  await review.update({ status: 'processing' });

  try {
    // Stage 1 — Normalize
    const normalizeResult = await normalize.process(review.toJSON());
    await review.update({
      normalized_text: normalizeResult.normalized_text,
      detected_language: normalizeResult.detected_language,
    });
    console.log(`[Pipeline] Stage 1 done — lang: ${normalizeResult.detected_language}`);

    // Stage 2 — Trust Filter
    const trustResult = await trust.process({
      ...review.toJSON(),
      normalized_text: normalizeResult.normalized_text,
    });
    await review.update({ text_hash: trustResult.hash });

    if (!trustResult.pass) {
      await review.update({ status: 'flagged', flag_reason: trustResult.reason });
      console.log(`[Pipeline] Review flagged: ${trustResult.reason}`);
      return;
    }
    console.log(`[Pipeline] Stage 2 done — passed trust filter`);

    // Stage 3 — Feature Extraction
    const extractResult = await extract.process(normalizeResult.normalized_text, review.rating, review.product_id);
    await review.update({
      features: JSON.stringify(extractResult.features),
      embedding: extractResult.embedding ? JSON.stringify(extractResult.embedding) : null,
      status: 'processed',
    });
    console.log(`[Pipeline] Stage 3 done — features: ${Object.keys(extractResult.features).join(', ') || 'none'}`);

    // Stage 4 — Graph Integration
    const graphResult = await graph.process(review.toJSON(), extractResult);
    console.log(`[Pipeline] Stage 4 done — ${graphResult.edges_created} edges created`);

    // Stage 5 — Time-Series Analysis
    const tsResult = await timeseries.process(review.product_id);
    console.log(`[Pipeline] Stage 5 done — ${tsResult.spikes.length} spikes detected`);

    // Check for alerts (spike threshold crossed)
    for (const spike of tsResult.spikes) {
      const existingAlert = await Alert.findOne({
        where: { product_id: review.product_id, feature: spike.feature },
        order: [['triggered_at', 'DESC']],
      });

      // Don't re-alert within the same week
      if (!existingAlert || existingAlert.triggered_at < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        const severity = spike.negative_rate > 0.80 ? 'high' : spike.negative_rate > 0.70 ? 'medium' : 'low';
        const alert = await Alert.create({
          id: uuidv4(),
          product_id: review.product_id,
          feature: spike.feature,
          severity,
          message: `${spike.feature.replace(/_/g, ' ')} negative sentiment spiked to ${Math.round(spike.negative_rate * 100)}% in week ${spike.week}`,
          triggered_at: new Date(),
        });
        emitAlert(alert.toJSON());
        console.log(`[Pipeline] Alert created: ${alert.message}`);
      }
    }

    // Stage 6 — Confidence Scoring
    const confResult = await confidence.process(review.product_id);
    console.log(`[Pipeline] Stage 6 done — ${confResult.insights_updated} insights updated`);

    // Stage 7 — Feedback (only for high-confidence negative issues)
    if (confResult.top_issues && confResult.top_issues.some(i => i.confidence > 0.6)) {
      const fbResult = await feedback.process(review.toJSON(), extractResult);
      console.log(`[Pipeline] Stage 7 done — ${fbResult.surveys.length} surveys generated`);
    }

    console.log(`[Pipeline] Complete for review ${reviewId}`);
  } catch (err) {
    console.error(`[Pipeline] Error at review ${reviewId}:`, err);
    await review.update({ status: 'processed' }); // Don't block on pipeline errors
  }
}

module.exports = runPipeline;
