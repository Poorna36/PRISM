/**
 * Stage 7 — Adaptive Feedback (Gemini survey + email)
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Survey } = require('../models');
const { sendSurveyEmail } = require('../utils/mailer');
const { getProductName } = require('../utils/productCatalog');

/** @see https://ai.google.dev/gemini-api/docs/models — use env override if a model is unavailable for your project */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function stripCodeFences(text) {
  if (!text) return '';
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '');
    t = t.replace(/\s*```\s*$/i, '');
  }
  return t.trim();
}

function buildFallbackQuestions(features, normalizedText) {
  const text = (normalizedText || '').toLowerCase();
  const keys = Object.keys(features || {});
  const label = keys.length ? keys[0].replace(/_/g, ' ') : 'this product';

  // Context-aware keyword matching for when Gemini is unavailable
  if (/blast|explod|burst|fire|burn|smoke|overheat/i.test(text)) {
    return [
      { question: `What were you doing when the ${label} issue occurred?`, type: 'text' },
      { question: `Was the product exposed to extreme heat or pressure?`, type: 'yesno' },
      { question: `How long had you been using the product before this happened?`, type: 'text' },
      { question: `How would you rate the severity of the issue?`, type: 'rating' },
    ];
  }
  if (/connect|bluetooth|bt|pair|disconnect|drop/i.test(text)) {
    return [
      { question: `What phone model and OS version are you using?`, type: 'text' },
      { question: `Do you know your device's Bluetooth version?`, type: 'text' },
      { question: `Does the issue happen in a specific location or distance?`, type: 'text' },
      { question: `How frequently does the disconnection occur?`, type: 'rating' },
    ];
  }
  if (/battery|charge|charging|drain|power|dies/i.test(text)) {
    return [
      { question: `How many hours does the battery last on a single charge?`, type: 'text' },
      { question: `Do you use features like ANC or high volume regularly?`, type: 'yesno' },
      { question: `How old is the product (approximate weeks of use)?`, type: 'text' },
      { question: `Rate your satisfaction with charging speed`, type: 'rating' },
    ];
  }
  if (/noise|crackling|static|buzz|hiss|sound quality/i.test(text)) {
    return [
      { question: `Does the audio issue happen with all content or specific types?`, type: 'text' },
      { question: `Have you tried using a different audio source?`, type: 'yesno' },
      { question: `At what volume level does the issue become noticeable?`, type: 'text' },
      { question: `Rate the overall sound quality excluding this issue`, type: 'rating' },
    ];
  }
  if (/deliver|package|packag|ship|damage|dent|crush|box/i.test(text)) {
    return [
      { question: `Was the product itself damaged or just the outer packaging?`, type: 'text' },
      { question: `Did you report the damage to the courier at delivery?`, type: 'yesno' },
      { question: `How many days after ordering did it arrive?`, type: 'text' },
      { question: `Rate the packaging quality on arrival`, type: 'rating' },
    ];
  }
  if (/temperature|cooling|cool|frost|freeze|warm|fridge|refriger/i.test(text)) {
    return [
      { question: `What temperature setting are you using on the appliance?`, type: 'text' },
      { question: `Is the product placed in a well-ventilated area?`, type: 'yesno' },
      { question: `How long after purchase did you first notice the issue?`, type: 'text' },
      { question: `Rate the cooling performance compared to your expectations`, type: 'rating' },
    ];
  }
  if (/drift|stick|analog|trigger|button|mushy|lag|input/i.test(text)) {
    return [
      { question: `Which specific button or control has the issue?`, type: 'text' },
      { question: `Does the issue occur in wired mode as well?`, type: 'yesno' },
      { question: `What games or apps do you primarily use with this controller?`, type: 'text' },
      { question: `Rate the overall controller responsiveness`, type: 'rating' },
    ];
  }
  if (/screen|display|pixel|bleed|backlight|flicker|line/i.test(text)) {
    return [
      { question: `Where on the screen is the issue located (center, corner, edge)?`, type: 'text' },
      { question: `Is the issue visible at all brightness levels?`, type: 'yesno' },
      { question: `What content were you viewing when you noticed it?`, type: 'text' },
      { question: `Rate the overall display quality excluding this issue`, type: 'rating' },
    ];
  }

  // Generic fallback
  return [
    { question: `How satisfied are you with ${label} overall?`, type: 'rating' },
    { question: `Was ${label} the main factor in your rating?`, type: 'yesno' },
    { question: `What one change would improve ${label} for you?`, type: 'text' },
    { question: `How likely are you to recommend this product based on ${label}?`, type: 'rating' },
  ];
}

async function generateSurveyQuestions(productName, normalizedText, features) {
  const featureKeys = Object.keys(features || {});
  const featureDetails = featureKeys.map(k => {
    const f = features[k];
    return `${k}: sentiment=${f?.sentiment || 'unknown'}, score=${f?.score || f?.similarity_score || 'N/A'}`;
  }).join('; ');

  const prompt = `You are a product quality investigator. A customer left this review for "${productName}":
"${normalizedText}"

Detected product features: ${featureDetails || 'none detected'}

Your job: Identify the SPECIFIC issue the customer experienced and generate 4 diagnostic follow-up questions that help the company understand the ROOT CAUSE.

Rules for question generation:
- If the product malfunctioned (exploded, stopped working, broke): Ask about usage conditions, environment, duration of use, and whether there was physical damage
- If there's a connectivity issue (Bluetooth, WiFi, pairing): Ask about their device model, OS version, Bluetooth/WiFi version, distance, and interference
- If battery/charging is the complaint: Ask about usage patterns (ANC on, volume level), charge cycles, and expected vs actual battery life
- If sound/audio quality is the issue: Ask about content type, volume level, and comparison to other devices
- If delivery/packaging is the complaint: Ask about courier handling, delivery timeline, and whether the product itself was affected
- If temperature/cooling is mentioned (for appliances): Ask about thermostat settings, ventilation, and ambient conditions
- If controller drift/buttons are the issue: Ask which specific control, wired vs wireless, and firmware version
- If display issues (dead pixels, backlight bleed): Ask about screen location, brightness levels, and content type

Generate exactly 4 SHORT questions (max 15 words each). Make them feel like a concerned support agent investigating the issue, not a generic survey.

Return ONLY valid JSON array, no markdown:
[
  {"question": "...", "type": "text"},
  {"question": "...", "type": "yesno"},
  {"question": "...", "type": "text"},
  {"question": "...", "type": "rating"}
]`;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return buildFallbackQuestions(features, normalizedText);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
    const response = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 30000 }
    );
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = stripCodeFences(text);
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length < 4) {
      return buildFallbackQuestions(features, normalizedText);
    }
    const expectedTypes = ['text', 'yesno', 'text', 'rating'];
    const four = parsed.slice(0, 4).map((q, i) => ({
      question: String(q.question || `Question ${i + 1}`).slice(0, 500),
      type: q.type || expectedTypes[i],
    }));
    return four;
  } catch (err) {
    console.warn(`[Stage 7] Gemini question generation failed: ${err.message}`);
    return buildFallbackQuestions(features, normalizedText);
  }
}

function looksLikeEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function pickRespondentEmail(userId, bodyEmail) {
  if (looksLikeEmail(userId)) return userId.trim();
  if (looksLikeEmail(bodyEmail)) return bodyEmail.trim();
  return null;
}

/**
 * Fire-and-forget: generate questions, persist survey, send email.
 * @param {{ review: object, normalizedText: string, features: object, productName: string, respondentEmail: string }} ctx
 */
async function executeAdaptiveFeedback(ctx) {
  const { review, normalizedText, features, productName, respondentEmail } = ctx;
  if (!respondentEmail) {
    console.log('[Stage 7] No respondent email — skipping adaptive feedback');
    return;
  }

  const questions = await generateSurveyQuestions(productName, normalizedText, features);
  const surveyId = uuidv4();

  await Survey.create({
    survey_id: surveyId,
    review_id: review.id,
    product_id: review.product_id,
    respondent_email: respondentEmail,
    questions,
    responses: null,
    summary: null,
    status: 'pending',
  });

  await sendSurveyEmail(respondentEmail, surveyId, productName, questions);
  console.log(`[Stage 7] Survey ${surveyId} emailed to ${respondentEmail}`);
}

function runAdaptiveFeedback(ctx) {
  void executeAdaptiveFeedback(ctx).catch((err) => {
    console.error('[Stage 7] Adaptive feedback failed:', err.message);
    if (err.response || err.responseCode) {
      console.error('[Stage 7] SMTP detail:', err.response || err);
    }
  });
}

/**
 * Demo Center: metadata for SSE (no DB write / no email).
 */
async function buildDemoStage7Payload(review, normalizeResult, extractResult) {
  const features = extractResult.features || {};
  const normalizedText = normalizeResult.normalized_text || review.review_text || '';
  const productName = getProductName(review.product_id);
  const email =
    pickRespondentEmail(review.user_id, review.email) || 'judge@example.com';

  await generateSurveyQuestions(productName, normalizedText, features);

  const featureKeys = Object.keys(features);
  return {
    stage: 7,
    name: 'Adaptive Feedback',
    status: 'sent',
    detail: `Survey emailed to ${email}. Awaiting response...`,
    respondent_email: email,
    gemini_feature_focus: featureKeys,
  };
}

/** @deprecated use buildDemoStage7Payload */
async function processDemo(review, extractResult, normalizeResult) {
  const norm = normalizeResult || { normalized_text: review.review_text || '' };
  return buildDemoStage7Payload(review, norm, extractResult);
}

module.exports = {
  runAdaptiveFeedback,
  executeAdaptiveFeedback,
  generateSurveyQuestions,
  pickRespondentEmail,
  getProductName,
  buildDemoStage7Payload,
  processDemo,
};
