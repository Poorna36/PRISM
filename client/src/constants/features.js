/** Feature keys and weights per docs/INSIGHTS.md — used for consistent chart colors. */
export const FEATURE_ORDER = [
  'app_performance',
  'battery_life',
  'build_quality',
  'value_for_money',
  'customer_service',
  'delivery',
  'packaging',
  'ui_ux',
  'quality',
  'features',
];

export const FEATURE_LABELS = {
  app_performance: 'App Performance',
  battery_life: 'Battery Life',
  build_quality: 'Build Quality',
  value_for_money: 'Value for Money',
  customer_service: 'Customer Service',
  delivery: 'Delivery',
  packaging: 'Packaging',
  ui_ux: 'UI/UX',
  quality: 'Quality',
  features: 'Features',
};

/** Distinct hues for Recharts / graph — same key = same color everywhere */
export const FEATURE_COLORS = {
  app_performance: '#00D4FF',
  battery_life: '#A78BFA',
  build_quality: '#F472B6',
  value_for_money: '#FBBF24',
  customer_service: '#34D399',
  delivery: '#FB923C',
  packaging: '#2DD4BF',
  ui_ux: '#FF6B35',
  quality: '#00E5A0',
  features: '#FACC15',
};

export function labelFeature(key) {
  return FEATURE_LABELS[key] || key?.replace(/_/g, ' ') || '—';
}
