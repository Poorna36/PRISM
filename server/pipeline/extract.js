/**
 * Stage 3 — Feature Extraction & Sentiment
 * Hybrid: keyword/regex signals ∪ embedding anchors (see featureSignals.js) + per-feature sentiment.
 */
const embeddings = require('./embeddings');
const featureSignals = require('./featureSignals');

// Positive/negative sentiment word lists (lightweight VADER-style)
const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'love', 'loved',
  'perfect', 'best', 'wonderful', 'brilliant', 'superb', 'impressive', 'happy',
  'fast', 'quick', 'smooth', 'solid', 'sturdy', 'reliable', 'durable', 'worth',
  'affordable', 'premium', 'beautiful', 'comfortable', 'satisfied', 'recommend',
  'outstanding', 'exceptional', 'pleased', 'delighted', 'quality', 'efficient',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'worst', 'horrible', 'hate', 'hated', 'poor',
  'cheap', 'broken', 'damaged', 'slow', 'lag', 'laggy', 'useless', 'waste',
  'disappointed', 'frustrating', 'defective', 'flimsy', 'overpriced', 'expensive',
  'issue', 'problem', 'complaint', 'refund', 'return', 'fail', 'failed', 'crash',
  'dead', 'weak', 'missing', 'delayed', 'late', 'pathetic', 'regret', 'worse',
]);

const NEGATION_WORDS = new Set(['not', 'no', 'never', 'neither', 'nor', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "cannot"]);

// Ambiguity confidence multipliers
const AMBIGUITY_MULTIPLIERS = {
  none: 1.00,
  vague: 0.85,
  mixed: 0.70,
  sarcasm: 0.55,
};

async function extract(normalizedText, rating, productId) {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return { features: {}, embedding: null };
  }

  // Get review embedding
  const reviewEmbedding = await embeddings.embed(normalizedText);

  const embeddingMatches = embeddings.detectFeatures(reviewEmbedding);
  const keywordMatches = featureSignals.detectKeywordFeatures(normalizedText, productId);
  let featureMatches = featureSignals.mergeFeatureMatches(embeddingMatches, keywordMatches, 6);

  if (Object.keys(featureMatches).length === 0) {
    featureMatches = embeddings.softTopFeatures(reviewEmbedding);
  }

  if (Object.keys(featureMatches).length === 0) {
    return { features: {}, embedding: reviewEmbedding };
  }

  // Split text into sentences
  const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 2);

  // For each matched feature, find best sentence and score sentiment
  const features = {};
  const anchors = embeddings.getFeatureAnchors();
  const anchorEmbs = embeddings.getAnchorEmbeddings();

  const sortedMatches = Object.entries(featureMatches).sort(
    (a, b) => b[1].similarity - a[1].similarity
  );

  for (const [feature, match] of sortedMatches) {
    // Find the sentence most similar to the feature anchor
    let bestSentence = normalizedText;
    let bestSim = match.similarity;

    if (sentences.length > 1) {
      const anchorEmb = anchorEmbs[feature];
      for (const sentence of sentences) {
        try {
          const sentEmb = await embeddings.embed(sentence.trim());
          const sim = embeddings.cosineSimilarity(sentEmb, anchorEmb);
          if (sim > bestSim) {
            bestSim = sim;
            bestSentence = sentence.trim();
          }
        } catch { /* skip sentence */ }
      }
    }

    // Score sentiment on the best sentence
    const sentimentResult = scoreSentiment(bestSentence);

    // Detect ambiguity
    const ambiguity = detectAmbiguity(bestSentence, sentimentResult, rating ?? null);

    features[feature] = {
      sentiment: sentimentResult.sentiment,
      score: +match.similarity.toFixed(3),
      similarity_score: +match.similarity.toFixed(3),
      anchor: anchors[feature],
      ambiguity: ambiguity,
      confidence_multiplier: AMBIGUITY_MULTIPLIERS[ambiguity || 'none'],
    };
  }

  return { features, embedding: reviewEmbedding };
}

function scoreSentiment(text) {
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  let negated = false;

  for (const word of words) {
    if (NEGATION_WORDS.has(word)) {
      negated = true;
      continue;
    }

    if (POSITIVE_WORDS.has(word)) {
      if (negated) { negativeScore++; negated = false; }
      else { positiveScore++; }
    } else if (NEGATIVE_WORDS.has(word)) {
      if (negated) { positiveScore++; negated = false; }
      else { negativeScore++; }
    } else {
      negated = false;
    }
  }

  const total = positiveScore + negativeScore;
  if (total === 0) {
    return { sentiment: 'positive', confidence: 0.5 };
  }

  const sentiment = positiveScore >= negativeScore ? 'positive' : 'negative';
  const confidence = Math.max(positiveScore, negativeScore) / total;
  return { sentiment, confidence: +confidence.toFixed(2) };
}

function detectAmbiguity(text, sentimentResult, rating) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Vague: low lexical density (< 4 content words)
  if (words.length < 4) {
    return 'vague';
  }

  // Mixed: both positive and negative signals present with close scores
  const posCount = words.filter(w => POSITIVE_WORDS.has(w)).length;
  const negCount = words.filter(w => NEGATIVE_WORDS.has(w)).length;
  if (posCount > 0 && negCount > 0 && Math.abs(posCount - negCount) <= 1) {
    return 'mixed';
  }

  // Sarcasm: contradiction between rating and text sentiment
  if (rating !== null && rating !== undefined) {
    if (rating >= 4 && sentimentResult.sentiment === 'negative') return 'sarcasm';
    if (rating <= 2 && sentimentResult.sentiment === 'positive') return 'sarcasm';
  }

  return null;
}

module.exports = { process: extract, scoreSentiment, detectAmbiguity, AMBIGUITY_MULTIPLIERS };
