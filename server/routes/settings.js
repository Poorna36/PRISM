/**
 * Settings routes — user-provided API keys and runtime config.
 * No server restart needed — all keys can be injected at runtime.
 */
const express = require('express');
const { resetTransporter } = require('../utils/mailer');
const router = express.Router();

// ─── In-memory runtime overrides ────────────────────────────────
let runtimeGeminiKey = null;
let runtimeSmtpUser  = null;
let runtimeSmtpPass  = null;

// ─── Gemini Key ─────────────────────────────────────────────────

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
 */
router.get('/gemini-key/status', (req, res) => {
  const key = runtimeGeminiKey || process.env.GEMINI_API_KEY;
  const configured = !!(key && key.trim().length >= 10);
  return res.json({ configured });
});

// ─── Sarvam Key ─────────────────────────────────────────────────

/**
 * POST /api/settings/sarvam-key
 */
router.post('/sarvam-key', (req, res) => {
  const { api_key } = req.body;
  if (!api_key || typeof api_key !== 'string' || api_key.trim().length < 10) {
    return res.status(400).json({ error: 'Invalid API key' });
  }
  process.env.SARVAM_API_KEY = api_key.trim();
  console.log('[Settings] Sarvam API key updated at runtime');
  return res.json({ configured: true });
});

/**
 * GET /api/settings/sarvam-key/status
 */
router.get('/sarvam-key/status', (req, res) => {
  const key = process.env.SARVAM_API_KEY;
  const configured = !!(key && key.trim().length >= 10);
  return res.json({ configured });
});

// ─── SMTP / Email ────────────────────────────────────────────────

/**
 * POST /api/settings/smtp
 * Set Gmail credentials at runtime — no server restart needed.
 * Body: { smtp_user: "you@gmail.com", smtp_pass: "xxxx xxxx xxxx xxxx" }
 */
router.post('/smtp', (req, res) => {
  const { smtp_user, smtp_pass } = req.body;

  if (!smtp_user || typeof smtp_user !== 'string' || !smtp_user.includes('@')) {
    return res.status(400).json({ error: 'Invalid smtp_user — must be a Gmail address' });
  }
  if (!smtp_pass || typeof smtp_pass !== 'string' || smtp_pass.replace(/\s+/g, '').length < 16) {
    return res.status(400).json({ error: 'Invalid smtp_pass — must be a 16-character Gmail App Password' });
  }

  runtimeSmtpUser = smtp_user.trim();
  runtimeSmtpPass = smtp_pass.replace(/\s+/g, ''); // strip spaces — Gmail app passwords often have spaces

  // Inject into process.env so mailer.js picks them up
  process.env.SMTP_USER = runtimeSmtpUser;
  process.env.SMTP_PASS = runtimeSmtpPass;

  // Reset the cached nodemailer transporter so it recreates with new creds
  resetTransporter();

  console.log(`[Settings] SMTP configured at runtime for ${runtimeSmtpUser}`);
  return res.json({ configured: true, smtp_user: runtimeSmtpUser });
});

/**
 * GET /api/settings/smtp/status
 * Returns whether SMTP is configured (never exposes credentials).
 */
router.get('/smtp/status', (req, res) => {
  const user = runtimeSmtpUser || process.env.SMTP_USER || '';
  const pass = runtimeSmtpPass || (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const configured = !!(user.includes('@') && pass.length >= 16);
  return res.json({ configured, smtp_user: configured ? user : null });
});

/**
 * POST /api/settings/smtp/test
 * Sends a test email to verify SMTP credentials work.
 */
router.post('/smtp/test', async (req, res) => {
  const { to } = req.body;
  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!user || !pass || pass.length < 16) {
    return res.status(400).json({
      error: 'SMTP not configured. POST /api/settings/smtp first.',
    });
  }

  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Provide a valid "to" email address' });
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"PRISM" <${user}>`,
      to,
      subject: 'PRISM — SMTP Test Email ✅',
      html: '<p>Your SMTP credentials are working correctly. Survey emails will be sent from this address.</p>',
    });
    console.log(`[Settings] Test email sent to ${to}`);
    return res.json({ sent: true, to });
  } catch (err) {
    console.error('[Settings] SMTP test failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/settings/status
 * One-shot status of all configurable keys.
 */
router.get('/status', (req, res) => {
  const geminiKey = runtimeGeminiKey || process.env.GEMINI_API_KEY || '';
  const sarvamKey = process.env.SARVAM_API_KEY || '';
  const smtpUser  = runtimeSmtpUser  || process.env.SMTP_USER || '';
  const smtpPass  = (runtimeSmtpPass || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  return res.json({
    gemini:  { configured: geminiKey.length >= 10 },
    sarvam:  { configured: sarvamKey.length >= 10 },
    smtp:    {
      configured: smtpUser.includes('@') && smtpPass.length >= 16,
      smtp_user: smtpUser.includes('@') ? smtpUser : null,
    },
  });
});

module.exports = router;
