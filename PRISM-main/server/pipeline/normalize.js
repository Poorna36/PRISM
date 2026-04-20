/**
 * Stage 1 — Normalize
 * Calls Sarvam AI API to normalize multilingual/noisy review text to clean English.
 */
const axios = require('axios');

async function normalize(review) {
  const inputText = review.transcript || review.review_text;

  if (!inputText || inputText.trim().length === 0) {
    return { normalized_text: '', detected_language: 'unknown' };
  }

  try {
    const response = await axios.post(
      'https://api.sarvam.ai/translate',
      {
        input: inputText,
        source_language_code: 'auto',
        target_language_code: 'en-IN',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'API-Subscription-Key': process.env.SARVAM_API_KEY,
        },
        timeout: 10000,
      }
    );

    return {
      normalized_text: response.data.translated_text || inputText,
      detected_language: response.data.source_language_code || 'en',
    };
  } catch (err) {
    console.warn(`[Stage 1] Sarvam API failed, using raw text: ${err.message}`);
    return {
      normalized_text: basicCleanup(inputText),
      detected_language: 'en',
    };
  }
}

function basicCleanup(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?'-]/g, '')
    .trim();
}

module.exports = { process: normalize };
