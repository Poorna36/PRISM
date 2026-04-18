/**
 * Stage 5 — Time-Series Analysis
 * Weekly sentiment aggregation, trend detection, spike flags, what_changed_this_week.
 */
const { Review } = require('../models');

const FEATURE_NAMES = [
  'battery_life', 'packaging', 'build_quality', 'customer_support',
  'delivery_speed', 'value_for_money', 'performance',
];

const SPIKE_THRESHOLD = 0.60; // >60% negative in any single week triggers spike

function getWeekString(date) {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function processTimeSeries(productId) {
  const reviews = await Review.findAll({
    where: { product_id: productId, status: 'processed' },
    order: [['timestamp', 'ASC']],
  });

  // Group by week
  const weeklyData = {};
  for (const review of reviews) {
    const week = getWeekString(review.timestamp);
    if (!weeklyData[week]) weeklyData[week] = [];
    weeklyData[week].push(review);
  }

  const sortedWeeks = Object.keys(weeklyData).sort();

  // Compute per-week, per-feature sentiment
  const weeklyTrends = [];
  const spikes = [];

  for (const week of sortedWeeks) {
    const weekReviews = weeklyData[week];
    const weekEntry = { week };

    for (const feature of FEATURE_NAMES) {
      let positive = 0;
      let negative = 0;

      for (const r of weekReviews) {
        if (!r.features) continue;
        let features;
        try { features = JSON.parse(r.features); } catch { continue; }
        if (features[feature]) {
          if (features[feature].sentiment === 'positive') positive++;
          else negative++;
        }
      }

      const total = positive + negative;
      if (total > 0) {
        const positiveRate = positive / total;
        const negativeRate = negative / total;
        weekEntry[feature] = +positiveRate.toFixed(2);

        // Spike detection
        if (negativeRate > SPIKE_THRESHOLD) {
          spikes.push({ week, feature, negative_rate: +negativeRate.toFixed(2) });
        }
      } else {
        weekEntry[feature] = null;
      }
    }

    weeklyTrends.push(weekEntry);
  }

  // What changed this week
  const whatChanged = {};
  if (sortedWeeks.length >= 2) {
    const current = weeklyTrends[weeklyTrends.length - 1];
    const previous = weeklyTrends[weeklyTrends.length - 2];

    for (const feature of FEATURE_NAMES) {
      const curr = current[feature] ?? 0;
      const prev = previous[feature] ?? 0;
      const delta = curr - prev;
      whatChanged[feature] = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'stable';
    }
  }

  // Trend direction (over last 4 weeks)
  const trendDirection = {};
  const recentWeeks = weeklyTrends.slice(-4);
  for (const feature of FEATURE_NAMES) {
    const values = recentWeeks.map(w => w[feature]).filter(v => v !== null);
    if (values.length >= 2) {
      const first = values[0];
      const last = values[values.length - 1];
      const delta = last - first;
      trendDirection[feature] = delta > 0.05 ? 'rising' : delta < -0.05 ? 'falling' : 'stable';
    }
  }

  return { weeklyTrends, whatChanged, spikes, trendDirection };
}

async function processDemo(productId) {
  const result = await processTimeSeries(productId);
  return {
    weeks_analyzed: result.weeklyTrends.length,
    spikes_detected: result.spikes.length,
    what_changed: result.whatChanged,
    trends: result.trendDirection,
  };
}

module.exports = { process: processTimeSeries, processDemo };
