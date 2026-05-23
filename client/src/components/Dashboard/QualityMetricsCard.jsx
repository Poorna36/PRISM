import { useState } from 'react';
import { motion } from 'framer-motion';

export default function QualityMetricsCard({ qualityMetrics }) {
  const [hoveredReason, setHoveredReason] = useState(null);
  
  if (!qualityMetrics) return null;

  const {
    total_ingested,
    passed_quality_check,
    flagged_as_spam_or_duplicate,
    flagged_breakdown,
    quality_pass_rate,
  } = qualityMetrics;

  const reasons = [
    { key: 'exact_duplicate_detected', label: '⊙ Exact Duplicates', color: 'bg-red-600' },
    { key: 'near_duplicate', label: '◐ Near Duplicates', color: 'bg-orange-600' },
    { key: 'generic/low-effort_review', label: '⊟ Generic/Low-effort', color: 'bg-amber-600' },
    { key: 'review_too_short_(<_3_words)', label: '⊢ Too Short', color: 'bg-yellow-600' },
    { key: 'unknown', label: '? Unknown', color: 'bg-slate-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-lg border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 shadow-xl shadow-black/40 backdrop-blur-sm hover:border-slate-600/80 transition-colors"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">🛡️</div>
          <h3 className="text-lg font-bold text-white">Quality Shield</h3>
        </div>
        <p className="text-xs text-slate-400">Spam & Duplicate Detection</p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-slate-800/50 p-3 border border-slate-700/40">
          <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Ingested</p>
          <p className="text-2xl font-bold text-white">{total_ingested}</p>
        </div>
        <div className="rounded-lg bg-emerald-900/20 p-3 border border-emerald-700/40">
          <p className="text-[10px] uppercase font-semibold text-emerald-400 mb-1">Passed</p>
          <p className="text-2xl font-bold text-emerald-300">{passed_quality_check}</p>
        </div>
        <div className="rounded-lg bg-red-900/20 p-3 border border-red-700/40">
          <p className="text-[10px] uppercase font-semibold text-red-400 mb-1">Flagged</p>
          <p className="text-2xl font-bold text-red-300">{flagged_as_spam_or_duplicate}</p>
        </div>
      </div>

      {/* Pass Rate Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-300">Quality Pass Rate</p>
          <p className="text-sm font-bold text-emerald-400">{quality_pass_rate}%</p>
        </div>
        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${quality_pass_rate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          />
        </div>
      </div>

      {/* Breakdown */}
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-3">Flagging Breakdown</p>
        <div className="space-y-2">
          {reasons.map(({ key, label, color }) => {
            const count = flagged_breakdown?.[key] || 0;
            const pct = flagged_as_spam_or_duplicate > 0 
              ? ((count / flagged_as_spam_or_duplicate) * 100).toFixed(0) 
              : 0;
            
            return count > 0 ? (
              <motion.div
                key={key}
                onMouseEnter={() => setHoveredReason(key)}
                onMouseLeave={() => setHoveredReason(null)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/30 transition-colors cursor-pointer group"
              >
                <div className={`${color} h-2 w-2 rounded-full`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300">{label}</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div className="w-12 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${color}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 w-8 text-right">
                    {count}
                    <span className="text-[9px] text-slate-500 ml-1">({pct}%)</span>
                  </span>
                </div>
              </motion.div>
            ) : null;
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          🔍 <strong>Exact duplicates</strong> are identical reviews (hash match). 
          <strong className="ml-2">Near-duplicates</strong> have 92%+ semantic similarity.
          Quality reviews feed the pipeline; flagged ones are archived.
        </p>
      </div>
    </motion.div>
  );
}
