import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { FEATURE_ORDER, FEATURE_COLORS, labelFeature } from '../../constants/features';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
    >
      <p className="mb-1 font-semibold text-slate-200">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-6 text-slate-300">
          <span style={{ color: p.color }}>{labelFeature(p.dataKey)}</span>
          <span className="tabular-nums">{((p.value ?? 0) * 100).toFixed(0)}%</span>
        </div>
      ))}
    </motion.div>
  );
}

export default function TrendChart({
  weeklyTrends,
  timeseriesVisual,
  activeFeature,
}) {
  const [mode, setMode] = useState('positive');

  const data = useMemo(() => {
    if (!weeklyTrends?.length) return [];
    return weeklyTrends.map((row) => {
      const out = { week: row.week };
      for (const f of FEATURE_ORDER) {
        if (mode === 'positive') {
          out[f] = row[f] != null ? row[f] : null;
        } else {
          const nk = `${f}_negative`;
          out[f] = row[nk] != null ? row[nk] : null;
        }
      }
      return out;
    });
  }, [weeklyTrends, mode]);

  const lines = useMemo(() => {
    const base = activeFeature ? [activeFeature] : FEATURE_ORDER;
    return base.filter((f) => data.some((d) => d[f] != null));
  }, [data, activeFeature]);

  const hintWeeks = useMemo(() => {
    const hints = timeseriesVisual?.hints || [];
    if (!hints.length || !activeFeature) return hints;
    return hints.filter((h) => h.feature === activeFeature);
  }, [timeseriesVisual, activeFeature]);

  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">
        Not enough weekly history for trends.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {mode === 'positive' ? 'Positive rate' : 'Negative rate'} · embedding-weighted
        </p>
        <div className="flex rounded-lg border border-slate-600/80 bg-slate-950/40 p-0.5 text-xs">
          <button
            type="button"
            className={`rounded-md px-3 py-1 transition ${mode === 'positive' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMode('positive')}
          >
            Positive
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1 transition ${mode === 'negative' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMode('negative')}
          >
            Negative
          </button>
        </div>
      </div>

      <motion.div
        className="h-72 w-full"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
            <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={{ stroke: '#475569' }}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {hintWeeks.map((h, i) => (
              <ReferenceLine
                key={`${h.week}-${i}`}
                x={h.week}
                stroke={h.pattern === 'batch_spike' ? '#fbbf24' : '#a78bfa'}
                strokeDasharray="4 4"
                label={{
                  value: h.pattern === 'batch_spike' ? 'batch' : 'design',
                  fill: '#cbd5e1',
                  fontSize: 9,
                }}
              />
            ))}
            {lines.map((f) => (
              <Line
                key={f}
                type="monotone"
                dataKey={f}
                name={labelFeature(f)}
                stroke={FEATURE_COLORS[f]}
                strokeWidth={activeFeature === f ? 3.5 : 2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
                isAnimationActive
                animationDuration={1100}
                animationEasing="ease-in-out"
                opacity={activeFeature && activeFeature !== f ? 0.2 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {timeseriesVisual?.legend && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Yellow dashed: batch / logistics spike · Purple dashed: sustained design-type drift
        </p>
      )}
    </div>
  );
}
