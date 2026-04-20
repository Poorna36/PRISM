const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Review } = require('../models');
const { emitNewReview } = require('../utils/socket');

const router = express.Router();

/**
 * POST /api/reviews/ingest
 * Called by simulation pages when a user submits a review.
 * Accepts review JSON, queues it, triggers pipeline asynchronously.
 */
router.post('/ingest', async (req, res) => {
  try {
    const {
      product_id,
      platform,
      review_text,
      transcript,
      rating,
      user_id,
      email,
      media_type = 'none',
      timestamp,
    } = req.body;

    if (!product_id || !platform || !rating || !user_id) {
      return res.status(400).json({ error: 'Missing required fields: product_id, platform, rating, user_id' });
    }

    if (!review_text && !transcript) {
      return res.status(400).json({ error: 'Either review_text or transcript is required' });
    }

    const review = await Review.create({
      id: uuidv4(),
      product_id,
      platform,
      review_text,
      transcript,
      rating,
      user_id,
      media_type,
      timestamp: timestamp || new Date().toISOString(),
      status: 'queued',
    });

    // Emit real-time new review event for Demo Center alerts
    emitNewReview({
      review_id: review.id,
      product_id,
      platform,
      rating,
      preview_text: (review_text || transcript || '').slice(0, 120),
      user_id,
      timestamp: review.timestamp,
    });

    // Trigger pipeline asynchronously — don't block the response
    const runPipeline = require('../pipeline');
    runPipeline(review.id, {
      fromIngest: true,
      respondentEmail: typeof email === 'string' ? email.trim() : email,
    }).catch(err => {
      console.error(`Pipeline error for review ${review.id}:`, err.message);
    });

    return res.status(201).json({
      review_id: review.id,
      status: 'queued',
      pipeline_triggered: true,
    });
  } catch (err) {
    console.error('Ingest error:', err);
    return res.status(500).json({ error: 'Failed to ingest review' });
  }
});

/**
 * GET /api/reviews/:productId
 * Returns paginated raw reviews for drill-down.
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20, feature, sentiment, platform } = req.query;

    const where = { product_id: productId };
    if (platform) where.platform = platform;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Review.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    // Filter by feature/sentiment in application layer (features stored as JSON)
    let reviews = rows.map(r => {
      const parsed = {
        ...r.toJSON(),
        features: r.features ? JSON.parse(r.features) : null,
      };
      return parsed;
    });

    if (feature) {
      reviews = reviews.filter(r => r.features && r.features[feature]);
    }
    if (sentiment && feature) {
      reviews = reviews.filter(r =>
        r.features && r.features[feature] && r.features[feature].sentiment === sentiment
      );
    }

    return res.json({
      reviews,
      total: count,
      page: parseInt(page),
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
