/**
 * Dashboard Pre-computation Cache
 * Warms all product dashboards on server boot, serves from memory,
 * and invalidates per-product when new reviews flow through the pipeline.
 */
const { Op } = require('sequelize');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes stale threshold

const store = {}; // { productId: { data, platform: { data }, ts } }
let warming = false;

/* ── Feature weights (mirrors dashboard.js) ───────────────────── */
const FEATURE_WEIGHTS = {
  performance: 0.20,
  battery_life: 0.18,
  build_quality: 0.15,
  value_for_money: 0.15,
  customer_support: 0.12,
  delivery_speed: 0.10,
  packaging: 0.10,
};
const FEATURE_KEYS = Object.keys(FEATURE_WEIGHTS);

/* ── Helpers (same logic as dashboard.js to keep parity) ──────── */
function computeFeatureSentiment(reviews) {
  const stats = {};
  for (const r of reviews) {
    if (!r.features) continue;
    let feats;
    try { feats = typeof r.features === 'string' ? JSON.parse(r.features) : r.features; } catch { continue; }
    for (const [f, d] of Object.entries(feats)) {
      if (!stats[f]) stats[f] = { positive: 0, negative: 0, count: 0 };
      stats[f].count++;
      if (d.sentiment === 'positive') stats[f].positive++;
      else stats[f].negative++;
    }
  }
  const result = {};
  for (const [f, s] of Object.entries(stats)) {
    result[f] = {
      positive: s.count > 0 ? +(s.positive / s.count).toFixed(2) : 0,
      negative: s.count > 0 ? +(s.negative / s.count).toFixed(2) : 0,
      count: s.count,
    };
  }
  return result;
}

function computeHealthScore(fs) {
  let score = 0;
  for (const [f, w] of Object.entries(FEATURE_WEIGHTS)) {
    if (fs[f]) score += fs[f].positive * w;
  }
  return Math.round(score * 100);
}

function getSentimentLabel(pct) {
  if (pct >= 0.80) return 'Overwhelmingly Positive';
  if (pct >= 0.65) return 'Mostly Positive';
  if (pct >= 0.50) return 'Moderately Positive';
  if (pct >= 0.35) return 'Mixed';
  return 'Mostly Negative';
}

function getWeekString(date) {
  const d = new Date(date);
  const ys = new Date(d.getFullYear(), 0, 1);
  const wn = Math.ceil(((d - ys) / 86400000 + ys.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`;
}

function buildTimeseriesVisualHints(weeklyTrends) {
  const hints = [];
  for (const f of FEATURE_KEYS) {
    const series = weeklyTrends
      .map((w) => ({ week: w.week, neg: w[`${f}_negative`] }))
      .filter((x) => x.neg !== null && x.neg !== undefined);
    if (series.length < 4) continue;
    for (let i = 1; i < series.length - 1; i++) {
      const prev = series[i - 1].neg;
      const cur = series[i].neg;
      const next = series[i + 1].neg;
      if (prev < 0.32 && cur > 0.52 && next < 0.42) {
        hints.push({
          feature: f, week: series[i].week, pattern: 'batch_spike',
          label: 'Batch / logistics-type spike',
          detail: `${f.replace(/_/g, ' ')} complaints surged in one week then eased — typical of a bad shipment run or carrier glitch.`,
        });
        break;
      }
    }
    let climbRun = 0;
    for (let i = 1; i < series.length; i++) {
      if (series[i].neg > series[i - 1].neg + 0.025) {
        climbRun++;
        if (climbRun >= 3) {
          hints.push({
            feature: f, week: series[i].week, pattern: 'design_creep',
            label: 'Design / sustained issue',
            detail: `${f.replace(/_/g, ' ')} negative share climbed across several weeks — typical of a hardware or UX design problem rather than a single bad batch.`,
          });
          break;
        }
      } else {
        climbRun = 0;
      }
    }
  }
  return hints;
}

function parseReviewFeaturesForPrimary(featuresField) {
  if (!featuresField) return null;
  let f;
  try { f = typeof featuresField === 'string' ? JSON.parse(featuresField) : featuresField; } catch { return null; }
  const entries = Object.entries(f || {});
  if (!entries.length) return null;
  entries.sort((a, b) => {
    const sa = Number(a[1]?.similarity_score ?? a[1]?.score ?? 0);
    const sb = Number(b[1]?.similarity_score ?? b[1]?.score ?? 0);
    return sb - sa;
  });
  return { primary: entries[0][0], orderedKeys: entries.map(([k]) => k) };
}

/* ── Build dashboard for one product (optionally platform-filtered) ── */
async function buildDashboard(productId, platformFilter) {
  const { Review, GraphNode, GraphEdge, Insight } = require('../models');

  const where = { product_id: productId, status: 'processed' };
  if (platformFilter) where.platform = platformFilter;

  const reviews = await Review.findAll({ where });
  const allForProduct = await Review.findAll({ where: { product_id: productId } });

  const flaggedCount = allForProduct.filter(r => r.status === 'flagged').length;
  const reviewCount = allForProduct.length;
  const fs = computeFeatureSentiment(reviews);
  const healthScore = computeHealthScore(fs);

  // Summary
  const totalPos = Object.values(fs).reduce((s, f) => s + (f.positive * f.count), 0);
  const totalCnt = Object.values(fs).reduce((s, f) => s + f.count, 0);
  const posPct = totalCnt > 0 ? totalPos / totalCnt : 0;
  const label = getSentimentLabel(posPct);
  const topIssues = Object.entries(fs).filter(([, v]) => v.negative > 0.3)
    .sort((a, b) => b[1].negative - a[1].negative).slice(0, 2)
    .map(([f, d]) => `${f.replace(/_/g, ' ')} (${Math.round(d.negative * 100)}%)`).join(' and ');
  let summary = `${label} (${Math.round(posPct * 100)}% positive, ${reviewCount} reviews)`;
  if (topIssues) summary += `, driven by ${topIssues} issues`;

  // Issues
  const issues = await Insight.findAll({ where: { product_id: productId }, order: [['confidence', 'DESC']] });

  // Weekly trends
  const byWeek = {};
  for (const r of reviews) { const w = getWeekString(r.timestamp); if (!byWeek[w]) byWeek[w] = []; byWeek[w].push(r); }
  const sortedWeeks = Object.keys(byWeek).sort().slice(-24);
  const weeklyTrends = sortedWeeks.map(w => {
    const wfs = computeFeatureSentiment(byWeek[w]);
    const entry = { week: w };
    for (const f of FEATURE_KEYS) {
      entry[f] = wfs[f] ? wfs[f].positive : null;
      entry[`${f}_negative`] = wfs[f] ? wfs[f].negative : null;
    }
    return entry;
  });
  const timeseries_visual = {
    hints: buildTimeseriesVisualHints(weeklyTrends),
    legend: {
      positive_rate: 'Share of mentions scored positive (health view)',
      negative_rate: 'Share of mentions scored negative (complaints view)',
      batch_spike: 'Short sharp surge — often batch, carrier, or packaging wave',
      design_creep: 'Gradual climb — often core product design or durability',
    },
  };

  // What changed
  const whatChanged = {};
  if (sortedWeeks.length >= 2) {
    const cfs = computeFeatureSentiment(byWeek[sortedWeeks[sortedWeeks.length - 1]]);
    const pfs = computeFeatureSentiment(byWeek[sortedWeeks[sortedWeeks.length - 2]]);
    for (const f of FEATURE_KEYS) {
      const d = (cfs[f]?.positive ?? 0) - (pfs[f]?.positive ?? 0);
      whatChanged[f] = d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'stable';
    }
  }

  // Graph data
  const nodes = await GraphNode.findAll({ where: { product_id: productId } });
  const nodeIds = nodes.map((n) => n.id);
  const reviewIds = [...new Set(nodes.map((n) => n.review_id).filter(Boolean))];
  const reviewRows = reviewIds.length > 0
    ? await Review.findAll({ where: { id: { [Op.in]: reviewIds } }, attributes: ['id', 'features'] })
    : [];
  const reviewFeatureMap = {};
  for (const r of reviewRows) reviewFeatureMap[r.id] = r.features;

  const edges = nodeIds.length > 0
    ? await GraphEdge.findAll({ where: { product_id: productId, source_node_id: { [Op.in]: nodeIds } } })
    : [];

  // Platform comparison
  const platformComp = {};
  for (const p of ['amazon', 'flipkart', 'jiomart', 'brand']) {
    const pr = reviews.filter(r => r.platform === p);
    if (pr.length > 0) {
      const pfs = computeFeatureSentiment(pr);
      platformComp[p] = { health_score: computeHealthScore(pfs), feature_sentiment: pfs };
    }
  }

  return {
    product_id: productId,
    health_score: healthScore,
    review_count: reviewCount,
    flagged_count: flaggedCount,
    feature_sentiment: fs,
    product_summary: summary,
    issues: issues.map(i => i.toJSON()),
    weekly_trends: weeklyTrends,
    timeseries_visual,
    what_changed_this_week: whatChanged,
    graph_data: {
      nodes: nodes.map((n) => {
        let primary = null;
        let featureList = [];
        const fromReview = parseReviewFeaturesForPrimary(reviewFeatureMap[n.review_id]);
        if (fromReview) {
          primary = fromReview.primary;
          featureList = fromReview.orderedKeys;
        } else {
          try {
            featureList = n.features ? JSON.parse(n.features) : [];
            primary = featureList[0] || null;
          } catch {
            featureList = [];
          }
        }
        let sentiments = {};
        try { sentiments = n.sentiments ? JSON.parse(n.sentiments) : {}; } catch { sentiments = {}; }
        const sentiment = primary && sentiments[primary] != null
          ? sentiments[primary]
          : Object.values(sentiments)[0] || null;
        return { id: n.id, feature: primary, features: featureList, sentiment, week: n.week };
      }),
      edges: edges.map((e) => ({
        source: e.source_node_id, target: e.target_node_id, weight: e.weight,
      })),
    },
    platform_comparison: platformComp,
  };
}

/* ── Build leaderboard ───────────────────────────────────────────── */
async function buildLeaderboard() {
  const { Review } = require('../models');
  const reviews = await Review.findAll({ where: { status: 'processed' } });
  const byProduct = {};
  for (const r of reviews) {
    if (!byProduct[r.product_id]) byProduct[r.product_id] = [];
    byProduct[r.product_id].push(r);
  }
  return Object.entries(byProduct).map(([pid, prs]) => {
    const fs = computeFeatureSentiment(prs);
    return { product_id: pid, name: pid.replace(/_/g, ' '), health_score: computeHealthScore(fs) };
  }).sort((a, b) => b.health_score - a.health_score);
}

/* ── Public API ──────────────────────────────────────────────────── */

async function warmAll() {
  warming = true;
  const t0 = Date.now();
  const products = ['prod_001', 'prod_002', 'prod_003', 'prod_004'];

  for (const pid of products) {
    try {
      const data = await buildDashboard(pid);
      store[pid] = { data, ts: Date.now() };
    } catch (err) {
      console.warn(`[Cache] Failed to warm ${pid}:`, err.message);
    }
  }

  try {
    store._leaderboard = { data: await buildLeaderboard(), ts: Date.now() };
  } catch (err) {
    console.warn('[Cache] Failed to warm leaderboard:', err.message);
  }

  warming = false;
  console.log(`[Cache] Dashboard cache warmed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

function getCache(productId) {
  const entry = store[productId];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null; // stale
  return entry.data;
}

function getLeaderboardCache() {
  const entry = store._leaderboard;
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.data;
}

async function invalidateProduct(productId) {
  // Rebuild this product's cache in the background
  try {
    const data = await buildDashboard(productId);
    store[productId] = { data, ts: Date.now() };

    // Also refresh leaderboard
    store._leaderboard = { data: await buildLeaderboard(), ts: Date.now() };
  } catch (err) {
    console.warn(`[Cache] Invalidation rebuild failed for ${productId}:`, err.message);
    // Remove stale entry so next request falls through to live computation
    delete store[productId];
    delete store._leaderboard;
  }
}

module.exports = {
  warmAll,
  getCache,
  getLeaderboardCache,
  invalidateProduct,
  buildDashboard,
  buildLeaderboard,
  isWarming: () => warming,
};
