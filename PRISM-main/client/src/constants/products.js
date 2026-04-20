/** Mirrors simulation/seed-reviews.json products for display names */
export const PRODUCTS = [
  { product_id: 'prod_001', name: 'Paralink Nord 3 Pro', emoji: '🎧' },
  { product_id: 'prod_002', name: 'Paralink Refrigerator', emoji: '❄️' },
  { product_id: 'prod_003', name: 'Paralink Gamepad Pro', emoji: '🎮' },
  { product_id: 'prod_004', name: 'Paralink 25 Inch Monitor', emoji: '🖥️' },
];

export function productNameMap() {
  return Object.fromEntries(PRODUCTS.map((p) => [p.product_id, p.name]));
}
