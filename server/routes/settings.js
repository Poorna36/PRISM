/**
 * Settings routes — user-provided API keys and runtime config.
 */
const express = require('express');
const router = express.Router();

// In-memory store for runtime Gemini key (overrides .env)
let runtimeGeminiKey = null;

/**
 * POST /api/settings/gemini-key
 * Store a Gemini API key at runtime (no restart needed).
 */
router.post('/gemini-key', (req, res) => {
  const { api_key } = req.body;
  if (!api_key || typeof api_key !== 'string' || api_key.trim().length < 10) {
    return res.status(400).json({ error: 'Invalid API key' });
  }

  runtimeGeminiKey = api_key.trim();
  process.env.GEMINI_API_KEY = runtimeGeminiKey;
  console.log('[Settings] Gemini API key updated at runtime');

  return res.json({ configured: true });
});

/**
 * GET /api/settings/gemini-key/status
 * Check whether a Gemini key is configured (never exposes the key).
 */
router.get('/gemini-key/status', (req, res) => {
  const key = runtimeGeminiKey || process.env.GEMINI_API_KEY;
  const configured = !!(key && key.trim().length >= 10);
  return res.json({ configured });
});

module.exports = router;
