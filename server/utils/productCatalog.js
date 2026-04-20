/**
 * Product display names for pipeline / surveys (matches simulation seed-data).
 */
const NAMES = {
  prod_001: 'Paralink Nord 3 Pro',
  prod_002: 'Paralink Refrigerator',
  prod_003: 'Paralink Gamepad Pro',
  prod_004: 'Paralink 25 Inch Monitor',
};

function getProductName(productId) {
  return NAMES[productId] || productId.replace(/_/g, ' ');
}

module.exports = { getProductName, NAMES };
