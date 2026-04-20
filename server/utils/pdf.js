/**
 * PDF Report Generator
 * Renders a consulting-style PDF report for a product using inline HTML.
 * Uses the html-pdf-node package (lightweight, no Puppeteer browser download needed).
 * Falls back to a JSON report if PDF rendering fails.
 *
 * Structure:
 * 1. Cover page — product name, date, platform scope
 * 2. Executive summary — health score, top 3 issues
 * 3. Feature-level analysis — sentiment bars per feature
 * 4. Product-level summary — Steam-style summary string
 * 5. Issue deep-dives — type, confidence, affected %, timeline
 * 6. Recommendations — full priority list with actions
 */
const fs = require('fs');
const path = require('path');
const { Review, Insight } = require('../models');

// Feature weights for health score calculation
const FEATURE_WEIGHTS = {
  performance: 0.20,
  battery_life: 0.18,
  build_quality: 0.15,
  value_for_money: 0.15,
  customer_support: 0.12,
  delivery_speed: 0.10,
  packaging: 0.10,
};

function getSentimentLabel(pct) {
  if (pct >= 0.80) return 'Overwhelmingly Positive';
  if (pct >= 0.65) return 'Mostly Positive';
  if (pct >= 0.50) return 'Moderately Positive';
  if (pct >= 0.35) return 'Mixed';
  return 'Mostly Negative';
}

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

/**
 * Generates the HTML content for the PDF report.
 */
function generateReportHTML(data) {
  const { productId, platform, healthScore, reviewCount, flaggedCount,
    featureSentiment, summary, issues, generatedAt } = data;

  const featureBarsHTML = Object.entries(featureSentiment)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([feature, stats]) => {
      const posWidth = Math.round(stats.positive * 100);
      const negWidth = Math.round(stats.negative * 100);
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 600; text-transform: capitalize;">${feature.replace(/_/g, ' ')}</span>
            <span style="color: #94a3b8; font-size: 12px;">${stats.count} reviews</span>
          </div>
          <div style="display: flex; height: 24px; border-radius: 4px; overflow: hidden; background: #334155;">
            <div style="width: ${posWidth}%; background: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 600;">${posWidth}%</div>
            <div style="width: ${negWidth}%; background: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 600;">${negWidth}%</div>
          </div>
        </div>`;
    }).join('');

  const issuesHTML = issues.slice(0, 10).map((issue, idx) => {
    const confColor = issue.confidence_level === 'green' ? '#22c55e' : issue.confidence_level === 'yellow' ? '#eab308' : '#ef4444';
    const sevColor = issue.severity === 'high' ? '#ef4444' : issue.severity === 'medium' ? '#eab308' : '#22c55e';
    return `
      <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid ${sevColor};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; text-transform: capitalize; color: #f1f5f9;">${(issue.feature || '').replace(/_/g, ' ')}</h4>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background: ${sevColor}22; color: ${sevColor}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${issue.severity}</span>
            <span style="background: ${confColor}22; color: ${confColor}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${issue.issue_type}</span>
          </div>
        </div>
        <div style="display: flex; gap: 24px; margin-bottom: 8px; font-size: 13px; color: #94a3b8;">
          <span>Confidence: <strong style="color: ${confColor};">${Math.round((issue.confidence || 0) * 100)}%</strong></span>
          <span>Affected: <strong>${Math.round((issue.affected_pct || 0) * 100)}%</strong> of reviews</span>
        </div>
        <p style="margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">${issue.recommendation || 'No recommendation available.'}</p>
      </div>`;
  }).join('');

  const topIssues = issues.slice(0, 3);
  const execSummaryItems = topIssues.map(i =>
    `<li style="margin-bottom: 6px;"><strong style="text-transform: capitalize;">${(i.feature || '').replace(/_/g, ' ')}</strong> — ${i.severity} severity, ${i.issue_type} issue (${Math.round((i.confidence || 0) * 100)}% confidence)</li>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 40px;
      line-height: 1.6;
    }
    .page-break { page-break-before: always; }
    h1 { font-size: 28px; color: #f1f5f9; margin-bottom: 8px; }
    h2 { font-size: 20px; color: #f1f5f9; margin-bottom: 16px; border-bottom: 2px solid #334155; padding-bottom: 8px; }
    h3 { font-size: 16px; color: #f1f5f9; margin-bottom: 12px; }
    .section { margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .score-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white; font-size: 32px; font-weight: 700;
    }
    .meta { color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>

  <!-- Section 1: Cover -->
  <div class="section" style="text-align: center; padding: 60px 0;">
    <h1 style="font-size: 36px; margin-bottom: 16px;">PRISM Intelligence Report</h1>
    <p style="font-size: 18px; color: #94a3b8; margin-bottom: 8px;">Product: <strong style="color: #f1f5f9; text-transform: capitalize;">${productId.replace(/_/g, ' ')}</strong></p>
    <p style="font-size: 14px; color: #64748b;">Platform: ${platform} | Generated: ${generatedAt}</p>
    <div style="margin-top: 40px;">
      <div class="score-badge" style="margin: 0 auto; width: 120px; height: 120px; font-size: 48px;">${healthScore}</div>
      <p style="margin-top: 12px; color: #94a3b8;">Health Score</p>
    </div>
  </div>

  <!-- Section 2: Executive Summary -->
  <div class="page-break"></div>
  <div class="section">
    <h2>Executive Summary</h2>
    <div class="card">
      <p style="font-size: 15px; margin-bottom: 16px;">${summary}</p>
      <div style="display: flex; gap: 32px; margin-bottom: 16px;">
        <div><span class="meta">Total Reviews</span><br><strong style="font-size: 24px;">${reviewCount}</strong></div>
        <div><span class="meta">Flagged</span><br><strong style="font-size: 24px; color: #ef4444;">${flaggedCount}</strong></div>
        <div><span class="meta">Health Score</span><br><strong style="font-size: 24px; color: #22c55e;">${healthScore}/100</strong></div>
      </div>
      ${topIssues.length > 0 ? `
        <h3>Top Issues</h3>
        <ol style="padding-left: 20px; color: #cbd5e1; font-size: 14px;">
          ${execSummaryItems}
        </ol>
      ` : '<p class="meta">No significant issues detected.</p>'}
    </div>
  </div>

  <!-- Section 3: Feature Analysis -->
  <div class="section">
    <h2>Feature-Level Sentiment Analysis</h2>
    <div class="card">
      ${featureBarsHTML || '<p class="meta">No feature data available.</p>'}
    </div>
  </div>

  <!-- Section 4: Product Summary -->
  <div class="page-break"></div>
  <div class="section">
    <h2>Product Summary</h2>
    <div class="card" style="text-align: center; padding: 32px;">
      <p style="font-size: 18px; font-style: italic; color: #f1f5f9;">"${summary}"</p>
    </div>
  </div>

  <!-- Section 5: Issue Deep-Dives -->
  <div class="section">
    <h2>Issue Analysis & Recommendations</h2>
    ${issuesHTML || '<div class="card"><p class="meta">No issues to report.</p></div>'}
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 24px 0; border-top: 1px solid #334155; margin-top: 32px;">
    <p class="meta">Generated by PRISM — Customer Review Intelligence Platform</p>
    <p class="meta">${generatedAt}</p>
  </div>

</body>
</html>`;
}

/**
 * Generate a PDF report for a product.
 * @param {string} productId - Product ID to report on
 * @param {string} platform - Platform filter ('all' for all platforms)
 * @param {string} reportId - UUID for the report file
 * @returns {object} - { filePath, reportUrl }
 */
async function generatePDF(productId, platform, reportId) {
  // Gather data
  const where = { product_id: productId, status: 'processed' };
  if (platform && platform !== 'all') where.platform = platform;

  const reviews = await Review.findAll({ where });
  const allForProduct = await Review.findAll({ where: { product_id: productId } });
  const flaggedCount = allForProduct.filter(r => r.status === 'flagged').length;
  const reviewCount = allForProduct.length;

  const featureSentiment = computeFeatureSentiment(reviews);
  const healthScore = computeHealthScore(featureSentiment);

  // Summary
  const totalPos = Object.values(featureSentiment).reduce((s, f) => s + (f.positive * f.count), 0);
  const totalCnt = Object.values(featureSentiment).reduce((s, f) => s + f.count, 0);
  const posPct = totalCnt > 0 ? totalPos / totalCnt : 0;
  const label = getSentimentLabel(posPct);
  const topIssueFeatures = Object.entries(featureSentiment).filter(([, v]) => v.negative > 0.3)
    .sort((a, b) => b[1].negative - a[1].negative).slice(0, 2)
    .map(([f, d]) => `${f.replace(/_/g, ' ')} (${Math.round(d.negative * 100)}%)`).join(' and ');
  let summary = `${label} (${Math.round(posPct * 100)}% positive, ${reviewCount} reviews)`;
  if (topIssueFeatures) summary += `, driven by ${topIssueFeatures} issues`;

  // Issues
  const issues = await Insight.findAll({
    where: { product_id: productId },
    order: [['confidence', 'DESC']],
  });

  const generatedAt = new Date().toISOString().split('T')[0];

  const html = generateReportHTML({
    productId,
    platform: platform || 'all',
    healthScore,
    reviewCount,
    flaggedCount,
    featureSentiment,
    summary,
    issues: issues.map(i => i.toJSON()),
    generatedAt,
  });

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save as HTML report (Puppeteer-free approach for hackathon)
  // This can be opened in browser and printed to PDF, or we can use
  // a lightweight html-to-pdf if available
  const htmlPath = path.join(reportsDir, `${reportId}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');

  // Try Puppeteer if available
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfPath = path.join(reportsDir, `${reportId}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    await browser.close();
    // Clean up HTML temp file
    fs.unlinkSync(htmlPath);
    return { filePath: pdfPath, reportUrl: `/reports/${reportId}.pdf` };
  } catch (err) {
    console.warn(`[PDF] Puppeteer not available, serving HTML report: ${err.message}`);
    // Fallback: serve the HTML report directly
    return { filePath: htmlPath, reportUrl: `/reports/${reportId}.html` };
  }
}

module.exports = { generatePDF, generateReportHTML };
