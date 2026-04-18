const express = require('express');
const axios = require('axios');
const { Survey } = require('../models');
const { Review } = require('../models');
const { buildSurveyFormHtml } = require('../utils/mailer');
const { getProductName } = require('../utils/productCatalog');
const { emitSurveySummary } = require('../utils/socket');

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function geminiSummarize(normalizedText, productName, qaLines) {
  const prompt = `Original product review for "${productName}":
"${normalizedText}"

The customer answered these follow-up survey questions:
${qaLines}

Write a 2-sentence summary of what the customer confirmed about their experience 
and one specific actionable recommendation for the company.
Be direct and specific. No filler phrases.`;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return 'Summary unavailable (GEMINI_API_KEY not set). Recommendation: review the survey responses manually.';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const response = await axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 30000 }
  );
  return (response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

router.get('/:surveyId', async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.surveyId);
    if (!survey) {
      return res.status(404).send('Survey not found');
    }
    const productName = getProductName(survey.product_id);
    const html = buildSurveyFormHtml(survey.survey_id, productName, survey.questions);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    console.error('[Survey GET]', err);
    return res.status(500).send('Error loading survey');
  }
});

router.post('/respond/:surveyId', async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.surveyId);
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    const answers = [req.body.q0, req.body.q1, req.body.q2, req.body.q3].map((a) =>
      a == null ? '' : String(a)
    );
    const questions = survey.questions || [];

    const review = await Review.findByPk(survey.review_id);
    const normalizedText = review?.normalized_text || review?.review_text || '';
    const productName = getProductName(survey.product_id);

    const qaLines = questions.map((q, i) => `Q: ${q.question}\nA: ${answers[i] || '(no answer)'}`).join('\n\n');

    const summary = await geminiSummarize(normalizedText, productName, qaLines);

    await survey.update({
      responses: answers,
      status: 'responded',
      summary,
    });

    emitSurveySummary({
      survey_id: survey.survey_id,
      review_id: survey.review_id,
      product_id: survey.product_id,
      summary,
      respondent_email: survey.respondent_email,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Thanks</title></head><body style="font-family:sans-serif;padding:24px">Thanks for your feedback. You can close this tab.</body></html>'
    );
  } catch (err) {
    console.error('[Survey POST]', err);
    return res.status(500).send('Error saving response');
  }
});

module.exports = router;
