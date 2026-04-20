const express = require('express');
const { Alert } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { dismissed: false },
      order: [['triggered_at', 'DESC']],
    });
    return res.json(alerts);
  } catch (err) {
    console.error('Alerts error:', err);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
