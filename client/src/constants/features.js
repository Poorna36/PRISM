/** Feature keys and weights per docs/INSIGHTS.md — used for consistent chart colors. */
export const FEATURE_ORDER = [
  'performance',
  'battery_life',
  'build_quality',
  'value_for_money',
  'customer_support',
  'delivery_speed',
  'packaging',
];

export const FEATURE_LABELS = {
  performance: 'Performance',
  battery_life: 'Battery Life',
  build_quality: 'Build Quality',
  value_for_money: 'Value for Money',
  customer_support: 'Customer Support',
  delivery_speed: 'Delivery Speed',
  packaging: 'Packaging',
};

/** Distinct hues for Recharts / graph — same key = same color everywhere */
export const FEATURE_COLORS = {
  performance: '#38bdf8',
  battery_life: '#a78bfa',
  build_quality: '#f472b6',
  value_for_money: '#fbbf24',
  customer_support: '#34d399',
  delivery_speed: '#fb923c',
  packaging: '#2dd4bf',
};

export function labelFeature(key) {
  return FEATURE_LABELS[key] || key?.replace(/_/g, ' ') || '—';
}
