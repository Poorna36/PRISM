/**
 * Verify Gemini survey JSON generation (no nodemailer required).
 * Optional: after `npm install` in server/, loads mailer and sends a test email.
 *
 * Usage:
 *   cd server
 *   $env:GEMINI_API_KEY="your-key"; node scripts/verify-stage7.js [recipient@email.com]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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
  if (!key || key === 'your-gemini-api-key') {
    throw new Error('Set GEMINI_API_KEY in .env or environment');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const response = await axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 60000 }
  );
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = stripCodeFences(text);
  const parsed = JSON.parse(cleaned);
  const expectedTypes = ['rating', 'yesno', 'text', 'rating'];
  return parsed.slice(0, 4).map((q, i) => ({
    question: String(q.question || `Question ${i + 1}`).slice(0, 500),
    type: expectedTypes[i],
  }));
}

async function trySendEmail(to, questions) {
  let sendSurveyEmail;
  try {
    ({ sendSurveyEmail } = require('../utils/mailer'));
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.warn('Skipping email: run `npm install` in server/ (nodemailer missing).');
      return;
    }
    throw e;
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass || user === 'your@gmail.com' || pass === 'your-gmail-app-password') {
    console.warn('Skipping email: set SMTP_USER and SMTP_PASS (Gmail App Password) in .env');
    return;
  }

  const surveyId = uuidv4();
  const productName = 'Paralink Nord 3 Pro';
  console.log('Sending test survey email to', to, '...');
  await sendSurveyEmail(to, surveyId, productName, questions);
  console.log('Sent. Open:', (process.env.SURVEY_BASE_URL || 'http://localhost:5000') + '/api/survey/' + surveyId);
}

async function main() {
  const to = process.argv[2] || process.env.TEST_SURVEY_TO || 'utkarshkumartiwari999@gmail.com';

  console.log('Model:', GEMINI_MODEL);
  const productName = 'Paralink Nord 3 Pro';
  const normalizedText = 'Great sound but battery dies fast. Packaging was crushed.';
  const features = { battery_life: { sentiment: 'negative' }, packaging: { sentiment: 'negative' } };

  console.log('Calling Gemini...');
  const questions = await generateSurveyQuestions(productName, normalizedText, features);
  console.log('OK — questions:\n', JSON.stringify(questions, null, 2));

  await trySendEmail(to, questions);
}

main().catch((e) => {
  console.error('FAILED:', e.response?.data || e.message);
  process.exit(1);
});
