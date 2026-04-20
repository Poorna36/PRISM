import { motion } from 'framer-motion';
import { FEATURE_ORDER, labelFeature } from '../../constants/features';

const arrow = {
  up: '↑',
  down: '↓',
  stable: '→',
};

const tone = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  stable: 'text-slate-400',
};

export default function WhatChangedStrip({ whatChanged }) {
  const keys = FEATURE_ORDER.filter((k) => whatChanged && whatChanged[k] != null);

  if (!keys.length) return null;

  return (
    <div className="panel p-4 shadow-panel">
      <p className="section-label mb-1">Momentum</p>
      <h3 className="mb-3 text-sm font-semibold text-slate-100">What changed this week</h3>
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => {
          const dir = whatChanged[k] || 'stable';
          return (
            <motion.span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <span className="text-slate-300">{labelFeature(k)}</span>
              <span className={`text-lg font-bold ${tone[dir]}`}>{arrow[dir]}</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
