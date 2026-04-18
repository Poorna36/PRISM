import { motion } from 'framer-motion';
import { FEATURE_ORDER, FEATURE_COLORS, labelFeature } from '../../constants/features';

export default function FeatureSentimentBars({
  featureSentiment,
  activeFeature,
  onFeatureClick,
}) {
  const keys = FEATURE_ORDER.filter((k) => featureSentiment && featureSentiment[k]);

  if (!keys.length) {
    return (
      <p className="text-sm text-slate-500">No feature-level sentiment yet — run the pipeline on more reviews.</p>
    );
  }

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">Click a tag to filter trends, graph, and drill-down.</p>
      <div className="space-y-3">
        {keys.map((key) => {
          const row = featureSentiment[key];
          const pos = row.positive ?? 0;
          const neg = row.negative ?? 0;
          const active = activeFeature === key;
          const color = FEATURE_COLORS[key] || '#94a3b8';

          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onFeatureClick(active ? null : key)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                    active ? 'text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  style={
                    active
                      ? { backgroundColor: color, boxShadow: `0 0 0 1px ${color}` }
                      : undefined
                  }
                >
                  {labelFeature(key)}
                </button>
                <span className="text-xs text-slate-500">{row.count} reviews</span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pos * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
                <motion.div
                  className="h-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${neg * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.05 }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-500">
                <span>pos {Math.round(pos * 100)}%</span>
                <span>neg {Math.round(neg * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
