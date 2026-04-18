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

function buildFallbackQuestions(features) {
  const keys = Object.keys(features || {});
  const label = keys.length ? keys[0].replace(/_/g, ' ') : 'this product';
  return [
    { question: `How satisfied are you with ${label} overall?`, type: 'rating' },
    { question: `Was ${label} the main factor in your rating?`, type: 'yesno' },
    { question: `What one change would improve ${label} for you?`, type: 'text' },
    { question: `How likely are you to recommend this product based on ${label}?`, type: 'rating' },
  ];
}

async function generateSurveyQuestions(productName, normalizedText, features) {
  const prompt = `A customer left this product review for "${productName}":
"${normalizedText}"

Detected product features mentioned: ${JSON.stringify(features)}

Generate exactly 4 short survey questions (max 12 words each) to validate 
and clarify the customer's experience with these specific product features. 
Make questions concrete and relevant to what they actually mentioned.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {"question": "...", "type": "rating"},
  {"question": "...", "type": "yesno"},
  {"question": "...", "type": "text"},
  {"question": "...", "type": "rating"}
]`;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return buildFallbackQuestions(features);
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
      return buildFallbackQuestions(features);
    }
    const expectedTypes = ['rating', 'yesno', 'text', 'rating'];
    const four = parsed.slice(0, 4).map((q, i) => ({
      question: String(q.question || `Question ${i + 1}`).slice(0, 500),
      type: expectedTypes[i],
    }));
    return four;
  } catch (err) {
    console.warn(`[Stage 7] Gemini question generation failed: ${err.message}`);
    return buildFallbackQuestions(features);
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
