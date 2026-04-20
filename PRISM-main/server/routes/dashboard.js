const express = require('express');
const { Op } = require('sequelize');
const { Review, GraphNode, GraphEdge, Insight } = require('../models');
const {
  getCache,
  getLeaderboardCache,
  buildDashboard,
  buildLeaderboard,
} = require('../utils/dashboardCache');

const router = express.Router();

/**
 * GET /api/dashboard/all
 * Returns leaderboard — cache-first, fallback to live computation.
 */
router.get('/all', async (req, res) => {
  try {
    // Try cache first
    const cached = getLeaderboardCache();
    if (cached) {
      return res.json(cached);
    }

    // Fallback: live computation
    const leaderboard = await buildLeaderboard();
    return res.json(leaderboard);
  } catch (err) {
    console.error('Dashboard all error:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/dashboard/:productId
 * Returns full dashboard — cache-first, fallback to live computation.
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { platform } = req.query;

    // Cache-first for non-platform-filtered requests
    if (!platform) {
      const cached = getCache(productId);
      if (cached) {
        return res.json(cached);
      }
    }

    // Fallback: live computation (handles platform filter too)
    const data = await buildDashboard(productId, platform || undefined);
    return res.json(data);
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;

