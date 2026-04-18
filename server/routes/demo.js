const express = require('express');
const router = express.Router();

/**
 * POST /api/demo/run
 * Demo Center endpoint. Receives a review, runs the pipeline stage-by-stage,
 * and streams results back via Server-Sent Events (SSE).
 */
router.post('/run', async (req, res) => {
  const { review } = req.body;
  if (!review) {
    return res.status(400).json({ error: 'Review object is required' });
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const normalize = require('../pipeline/normalize');
    const trust = require('../pipeline/trust');
    const extract = require('../pipeline/extract');
    const graphStage = require('../pipeline/graph');
    const timeseries = require('../pipeline/timeseries');
    const confidence = require('../pipeline/confidence');
    const feedback = require('../pipeline/feedback');

    // Stage 1 — Normalize
    sendEvent('stage', { stage: 1, name: 'Normalization', status: 'running' });
    const normalizeResult = await normalize.process(review);
    sendEvent('stage', { stage: 1, name: 'Normalization', status: 'done', result: normalizeResult });
    await delay(400);

    // Stage 2 — Trust Filter
    sendEvent('stage', { stage: 2, name: 'Trust Filter', status: 'running' });
    const trustResult = await trust.process({ ...review, normalized_text: normalizeResult.normalized_text });
    sendEvent('stage', { stage: 2, name: 'Trust Filter', status: 'done', result: trustResult });
    await delay(400);

    if (!trustResult.pass) {
      sendEvent('done', { filtered: true, reason: trustResult.reason });
      return res.end();
    }

    // Stage 3 — Feature Extraction
    sendEvent('stage', { stage: 3, name: 'Feature Extraction', status: 'running' });
    const extractResult = await extract.process(
      normalizeResult.normalized_text,
      review.rating,
      review.product_id
    );
    sendEvent('stage', { stage: 3, name: 'Feature Extraction', status: 'done', ...extractResult });
    await delay(400);

    // Stage 4 — Graph Integration
    sendEvent('stage', { stage: 4, name: 'Graph Integration', status: 'running' });
    const graphResult = await graphStage.processDemo(review, extractResult);
    sendEvent('stage', { stage: 4, name: 'Graph Integration', status: 'done', result: graphResult });
    await delay(400);

    // Stage 5 — Time-Series
    sendEvent('stage', { stage: 5, name: 'Time-Series Analysis', status: 'running' });
    const tsResult = await timeseries.processDemo(review.product_id);
    sendEvent('stage', { stage: 5, name: 'Time-Series Analysis', status: 'done', result: tsResult });
    await delay(400);

    // Stage 6 — Confidence
    sendEvent('stage', { stage: 6, name: 'Confidence Scoring', status: 'running' });
    const confResult = await confidence.processDemo(review.product_id);
    sendEvent('stage', { stage: 6, name: 'Confidence Scoring', status: 'done', result: confResult });
    await delay(400);

    // Stage 7 — Adaptive Feedback (SSE: survey sent; live summary via Socket.io survey:summary)
    await delay(400);
    const stage7Payload = await feedback.buildDemoStage7Payload(review, normalizeResult, extractResult);
    sendEvent('stage', stage7Payload);

    sendEvent('done', { insight_delta: { health_score: confResult?.health_score ?? null } });
  } catch (err) {
    console.error('Demo run error:', err);
    sendEvent('error', { message: err.message });
  }

  res.end();
});

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = router;
