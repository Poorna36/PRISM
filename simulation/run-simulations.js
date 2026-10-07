/**
 * run-simulations.js
 * Submits live simulated reviews from all 4 platforms (Amazon, Flipkart, JioMart, Brand Store)
 * into the PRISM intelligence ingestion pipeline.
 */

const platforms = [
  {
    platform: 'amazon',
    product_id: 'prod_001',
    rating: 4,
    text: 'Active noise cancellation works very well during daily metro commute. Solid battery life.',
    user: 'Amit Sharma',
    email: 'amit.sharma@example.com'
  },
  {
    platform: 'flipkart',
    product_id: 'prod_002',
    rating: 5,
    text: 'Freezer cooling is super fast, maintains cold temperature with very low electricity consumption.',
    user: 'Pooja Verma',
    email: 'pooja.verma@example.com'
  },
  {
    platform: 'jiomart',
    product_id: 'prod_003',
    rating: 2,
    text: 'Analog stick started drifting slightly to the left during intense racing games after 2 weeks.',
    user: 'Vikram Singh',
    email: 'vikram.singh@example.com'
  },
  {
    platform: 'brand',
    product_id: 'prod_004',
    rating: 5,
    text: '165Hz gaming panel is ultra crisp and color calibration out of the box is top tier.',
    user: 'Neha Kapoor',
    email: 'neha.kapoor@example.com'
  }
];

async function main() {
  console.log('─── Starting Simulated Review Ingestion from All 4 Platforms ───');
  
  for (const item of platforms) {
    try {
      const res = await fetch('http://localhost:5000/api/reviews/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.product_id,
          platform: item.platform,
          review_text: item.text,
          rating: item.rating,
          user_id: item.user,
          email: item.email,
          media_type: 'none',
          timestamp: new Date().toISOString()
        })
      });

      const data = await res.json();
      console.log(`✓ [${item.platform.toUpperCase()}] Review submitted for ${item.product_id}: status ${res.status}, ID: ${data.review_id}`);
    } catch (err) {
      console.error(`✗ [${item.platform.toUpperCase()}] Failed:`, err.message);
    }
  }

  console.log('─── Ingestion Complete: Pipeline is processing all reviews asynchronously ───');
}

main();
