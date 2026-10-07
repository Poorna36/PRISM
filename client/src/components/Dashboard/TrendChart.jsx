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

  // Process real weekly trends from backend with linear interpolation across sparse weeks
  const data = useMemo(() => {
    if (!weeklyTrends || !weeklyTrends.length) return [];

    // Take the most recent weeks (up to 16 for clean display, or all if <= 16)
    const rawWeeks = weeklyTrends.length > 16 ? weeklyTrends.slice(-16) : weeklyTrends;

    // 1. Extract raw sentiment values per feature based on selected mode
    const series = {};
    for (const f of FEATURE_ORDER) {
      series[f] = rawWeeks.map((w) => {
        const raw = mode === 'positive' ? w[f] : w[`${f}_negative`];
        return raw !== null && raw !== undefined ? Number(raw) : null;
      });
    }

    // 2. Interpolate, back-fill, and forward-fill each feature line
    for (const f of FEATURE_ORDER) {
      const arr = series[f];
      const firstIdx = arr.findIndex((v) => v !== null);

      if (firstIdx === -1) {
        // Feature had zero mentions across all weeks: set sensible neutral baseline
        const defaultVal = mode === 'positive' ? 0.85 : 0.15;
        for (let i = 0; i < arr.length; i++) arr[i] = defaultVal;
        continue;
      }

      // Back-fill leading nulls
      for (let i = 0; i < firstIdx; i++) {
        arr[i] = arr[firstIdx];
      }

      // Interpolate between observed data points
      let lastKnownIdx = firstIdx;
      for (let i = firstIdx + 1; i < arr.length; i++) {
        if (arr[i] !== null) {
          const gap = i - lastKnownIdx;
          const startVal = arr[lastKnownIdx];
          const endVal = arr[i];
          for (let j = 1; j < gap; j++) {
            arr[lastKnownIdx + j] = +(startVal + (endVal - startVal) * (j / gap)).toFixed(2);
          }
          lastKnownIdx = i;
        }
      }

      // Forward-fill trailing nulls with last known score
      for (let i = lastKnownIdx + 1; i < arr.length; i++) {
        arr[i] = arr[lastKnownIdx];
      }
    }

    // 3. Assemble chart data
    return rawWeeks.map((w, idx) => {
      const out = { week: w.week };
      for (const f of FEATURE_ORDER) {
        out[f] = series[f][idx];
      }
      return out;
    });
  }, [weeklyTrends, mode]);

  const lines = useMemo(() => {
    return activeFeature ? [activeFeature] : FEATURE_ORDER;
  }, [activeFeature]);

  // Use real hints from Stage 5 Time-Series analysis
  const hintWeeks = useMemo(() => {
    const hints = timeseriesVisual?.hints || [];
    if (!activeFeature) return hints;
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
            <XAxis
              dataKey="week"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(w) => (w ? w.replace(/^\d{4}-/, '') : '')}
              interval="preserveStartEnd"
            />
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
                dot={true}
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
