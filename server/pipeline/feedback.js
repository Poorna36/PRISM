/**
 * Stage 7 — Adaptive Feedback
 * Calls Gemini API to generate follow-up survey questions based on detected issues.
 */
const axios = require('axios');

async function processFeedback(review, extractResult) {
  const features = extractResult.features || {};
  const featureNames = Object.keys(features);

  if (featureNames.length === 0) {
    return { surveys: [], message: 'No features detected — no survey generated' };
  }

  // Pick the top feature (highest similarity score)
  const topFeature = featureNames.sort((a, b) => (features[b].score || 0) - (features[a].score || 0))[0];
  const featureData = features[topFeature];

  const prompt = `Given this customer review: "${review.review_text || review.transcript}"

And the detected issue:
- Feature: ${topFeature.replace(/_/g, ' ')}
- Sentiment: ${featureData.sentiment}
- Issue type: ${featureData.ambiguity || 'clear'}

Generate exactly 2 short follow-up survey questions to clarify whether this issue is general or segment-specific. Return only the questions, one per line, numbered.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      { timeout: 15000 }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const questions = text.split('\n').filter(l => l.trim().length > 0).slice(0, 2);

    return {
      surveys: [{
        feature: topFeature,
        questions,
        status: 'generated',
      }],
      message: 'Survey questions generated via Gemini',
    };
  } catch (err) {
    console.warn(`[Stage 7] Gemini API failed: ${err.message}`);
    // Fallback: generate generic questions
    return {
      surveys: [{
        feature: topFeature,
        questions: [
          `How often do you experience issues with ${topFeature.replace(/_/g, ' ')}?`,
          `Is this ${topFeature.replace(/_/g, ' ')} issue specific to your usage pattern or a general concern?`,
        ],
        status: 'fallback',
      }],
      message: 'Used fallback survey questions (Gemini unavailable)',
    };
  }
}

async function processDemo(review, extractResult) {
  return await processFeedback(review, extractResult);
}

module.exports = { process: processFeedback, processDemo };
