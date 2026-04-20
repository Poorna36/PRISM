const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { generatePDF } = require('../utils/pdf');

const router = express.Router();

/**
 * POST /api/reports/generate
 * Triggers PDF generation for a product.
 * Returns a download URL once the report is generated.
 */
router.post('/generate', async (req, res) => {
  try {
    const { product_id, platform = 'all' } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const reportId = uuidv4();
    const result = await generatePDF(product_id, platform, reportId);

    return res.json({
      report_url: result.reportUrl,
      status: 'completed',
      message: 'Report generated successfully',
    });
  } catch (err) {
    console.error('Report generation error:', err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
