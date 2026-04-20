/**
 * Stage 6 — Confidence Scoring & Ranking
 * Applies ambiguity penalty, computes confidence per cluster/issue,
 * maps to green/yellow/red levels, generates recommendations.
 */
const { v4: uuidv4 } = require('uuid');
const { GraphNode, Insight, Review } = require('../models');
const embeddings = require('./embeddings');
const { AMBIGUITY_MULTIPLIERS } = require('./extract');

// Confidence formula weights
// confidence = (frequency × 0.40) + (cluster_density × 0.35) + (sentiment_consistency × 0.25)

// Severity weights for ranking
const SEVERITY_WEIGHTS = { high: 3, medium: 2, low: 1 };

// Recommendation action map
const RECOMMENDATIONS = {
  battery_life: {
    systemic: 'Investigate battery component supplier. Consider hardware revision for next production batch.',
    batch: 'Check recent production batch for battery assembly defects. Isolate affected units.',
    isolated: 'Monitor battery complaints. May be usage-specific. Gather more data.',
  },
  packaging: {
    systemic: 'Overhaul packaging design and materials. Current packaging consistently fails in transit.',
    batch: 'Check packaging line for recent batches. Possible supplier or process change.',
    isolated: 'Likely transit damage. Monitor carrier performance.',
  },
  build_quality: {
    systemic: 'Review manufacturing quality control process. Consistent build quality complaints suggest design issue.',
    batch: 'Inspect recent production batch for material or assembly deviations.',
    isolated: 'Individual defect. Standard warranty process applies.',
  },
  customer_support: {
    systemic: 'Retrain support team. Review SLA and response protocols. Systemic dissatisfaction detected.',
    batch: 'Spike in support complaints. Check staffing levels and recent process changes.',
    isolated: 'Individual support experience. No systemic action needed.',
  },
  delivery_speed: {
    systemic: 'Review logistics partner performance. Consider switching carriers for affected regions.',
    batch: 'Recent delivery delays detected. Check warehouse capacity and carrier schedules.',
    isolated: 'Single delivery issue. No pattern detected.',
  },
  value_for_money: {
    systemic: 'Review pricing strategy. Customers consistently perceive product as overpriced for its category.',
    batch: 'Recent value perception drop. May correlate with competitor pricing changes.',
    isolated: 'Individual perception. No broad pricing action needed.',
  },
  performance: {
    systemic: 'Investigate performance bottlenecks. May require firmware/software update or hardware revision.',
    batch: 'Recent performance complaints. Check for software update issues or batch-specific hardware.',
    isolated: 'Individual performance issue. Standard troubleshooting applies.',
  },
};

async function processConfidence(productId) {
  const nodes = await GraphNode.findAll({ where: { product_id: productId } });

  // Group nodes by cluster
  const clusters = {};
  for (const node of nodes) {
    const cid = node.cluster_id || node.id;
    if (!clusters[cid]) clusters[cid] = [];
    clusters[cid].push(node);
  }

  const insights = [];

  for (const [clusterId, clusterNodes] of Object.entries(clusters)) {
    if (clusterNodes.length === 0) continue;

    // Get dominant feature and sentiment
    const featureCounts = {};
    const sentimentCounts = {};

    for (const node of clusterNodes) {
      const features = JSON.parse(node.features || '[]');
      const sentiments = JSON.parse(node.sentiments || '{}');

      for (const f of features) {
        featureCounts[f] = (featureCounts[f] || 0) + 1;
        const sent = sentiments[f] || 'positive';
        const key = `${f}:${sent}`;
        sentimentCounts[key] = (sentimentCounts[key] || 0) + 1;
      }
    }

    const dominantFeature = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0];
    if (!dominantFeature) continue;

    const feature = dominantFeature[0];
    const clusterType = clusterNodes[0].cluster_type || 'isolated';

    // Frequency score: normalized by total reviews for product
    const totalReviews = await Review.count({ where: { product_id: productId, status: 'processed' } });
    const frequencyScore = Math.min(1.0, clusterNodes.length / Math.max(totalReviews * 0.3, 1));

    // Cluster density: edges per node ratio
    const clusterDensity = Math.min(1.0, clusterNodes.length / 8);

    // Sentiment consistency
    const negCount = sentimentCounts[`${feature}:negative`] || 0;
    const posCount = sentimentCounts[`${feature}:positive`] || 0;
    const total = negCount + posCount;
    const sentimentConsistency = total > 0 ? Math.max(negCount, posCount) / total : 0.5;

    // Apply ambiguity penalty (average across cluster reviews)
    let ambiguityPenalty = 1.0;
    let ambiguityCount = 0;
    for (const node of clusterNodes) {
      const review = await Review.findOne({ where: { id: node.review_id } });
      if (review && review.features) {
        try {
          const features = JSON.parse(review.features);
          if (features[feature] && features[feature].confidence_multiplier) {
            ambiguityPenalty += features[feature].confidence_multiplier;
            ambiguityCount++;
          }
        } catch { /* skip */ }
      }
    }
    if (ambiguityCount > 0) ambiguityPenalty = ambiguityPenalty / (ambiguityCount + 1);

    // Confidence formula
    let confidence = ((frequencyScore * 0.40) + (clusterDensity * 0.35) + (sentimentConsistency * 0.25)) * ambiguityPenalty;

    // Optional: embedding coherence bonus
    if (clusterNodes.length >= 3) {
      let coherentPairs = 0;
      let totalPairs = 0;
      for (let i = 0; i < Math.min(clusterNodes.length, 10); i++) {
        for (let j = i + 1; j < Math.min(clusterNodes.length, 10); j++) {
          if (clusterNodes[i].embedding && clusterNodes[j].embedding) {
            try {
              const embA = JSON.parse(clusterNodes[i].embedding);
              const embB = JSON.parse(clusterNodes[j].embedding);
              if (embeddings.cosineSimilarity(embA, embB) > 0.70) coherentPairs++;
              totalPairs++;
            } catch { /* skip */ }
          }
        }
      }
      if (totalPairs > 0 && coherentPairs / totalPairs > 0.5) {
        confidence = Math.min(1.0, confidence + 0.05);
      }
    }

    confidence = +Math.min(1.0, Math.max(0, confidence)).toFixed(3);

    // Level mapping
    let confidenceLevel;
    if (confidence >= 0.75) confidenceLevel = 'green';
    else if (confidence >= 0.45) confidenceLevel = 'yellow';
    else confidenceLevel = 'red';

    // Severity
    const isNegative = negCount > posCount;
    let severity;
    if (isNegative && clusterNodes.length >= 8) severity = 'high';
    else if (isNegative && clusterNodes.length >= 4) severity = 'medium';
    else severity = 'low';

    // Affected percentage
    const affectedPct = totalReviews > 0 ? +(clusterNodes.length / totalReviews).toFixed(2) : 0;

    // Recommendation
    const recommendation = (RECOMMENDATIONS[feature] && RECOMMENDATIONS[feature][clusterType])
      || `Monitor ${feature.replace(/_/g, ' ')} feedback. Cluster type: ${clusterType}.`;

    // Upsert insight
    const existing = await Insight.findOne({ where: { product_id: productId, feature, cluster_id: clusterId } });
    if (existing) {
      await existing.update({ issue_type: clusterType, severity, confidence, confidence_level: confidenceLevel, affected_pct: affectedPct, recommendation });
    } else {
      await Insight.create({
        id: uuidv4(),
        product_id: productId,
        feature,
        issue_type: clusterType,
        severity,
        confidence,
        confidence_level: confidenceLevel,
        affected_pct: affectedPct,
        recommendation,
        cluster_id: clusterId,
      });
    }

    insights.push({ feature, clusterType, severity, confidence, confidenceLevel });
  }

  return { insights_updated: insights.length, top_issues: insights.sort((a, b) => (b.confidence * SEVERITY_WEIGHTS[b.severity]) - (a.confidence * SEVERITY_WEIGHTS[a.severity])).slice(0, 5) };
}

async function processDemo(productId) {
  const result = await processConfidence(productId);
  return result;
}

module.exports = { process: processConfidence, processDemo };
