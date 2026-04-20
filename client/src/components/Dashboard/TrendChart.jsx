import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { FEATURE_ORDER, FEATURE_COLORS, labelFeature } from '../../constants/features';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-3 shadow-lg"
    >
      <p className="mb-2 font-display font-semibold text-text-primary text-xs">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 items-center text-xs">
          <span className="font-mono" style={{ color: p.color }}>
            {labelFeature(p.dataKey)}
          </span>
          <span className="font-mono text-text-primary tabular-nums">
            {((p.value ?? 0) * 100).toFixed(1)}%
          </span>
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

  // MOCK DATA FOR HACKATHON DEMO
  const data = useMemo(() => {
    const weeks = [];
    // Generate 12 weeks of historical data
    for (let i = 12; i >= 1; i--) {
      weeks.push(`2026-W${20 - i}`);
    }
    
    return weeks.map((week, idx) => {
      const out = { week };
      for (const f of FEATURE_ORDER) {
        // Base random value around 80% positive
        let val = 0.7 + (Math.random() * 0.25);
        
        // Create a fake spike for app_performance in W17 (negative)
        if (f === 'app_performance' && mode === 'negative' && week === '2026-W17') {
          val = 0.95;
        } else if (f === 'ui_ux' && mode === 'negative') {
          // Sustained design issue for ui_ux
          val = 0.6 + (Math.random() * 0.1);
        } else if (mode === 'negative') {
          val = 1 - val; // Invert for negative view
        }
        
        // Add some noise
        val = Math.max(0, Math.min(1, val));
        out[f] = val;
      }
      return out;
    });
  }, [mode]);

  const lines = useMemo(() => {
    return activeFeature ? [activeFeature] : FEATURE_ORDER;
  }, [activeFeature]);

  const timelineMarkers = useMemo(() => {
    const markers = [
      { week: '2026-W17', name: 'App Update v2.4', type: 'update' },
      { week: '2026-W14', name: 'UI Redesign', type: 'update' },
      { week: '2026-W11', name: 'Feature Launch', type: 'update' }
    ];
    return markers;
  }, []);

  const spikeZones = useMemo(() => {
    // Define weeks with high negative sentiment
    return [
      { startWeek: '2026-W17', endWeek: '2026-W18' }
    ];
  }, []);

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-text-secondary font-mono">Not enough weekly history for trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary font-mono">
          {mode === 'positive' ? 'Positive' : 'Negative'} sentiment · embedding-weighted
        </p>
        <div className="flex items-center gap-1 bg-bg-elevated rounded-industrial p-1">
          <button
            type="button"
            className={`px-3 py-1 rounded-industrial text-xs font-mono transition-all ${
              mode === 'positive' 
                ? 'bg-accent-cyan text-bg-base' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setMode('positive')}
          >
            Positive
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-industrial text-xs font-mono transition-all ${
              mode === 'negative' 
                ? 'bg-accent-cyan text-bg-base' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setMode('negative')}
          >
            Negative
          </button>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        className="h-80 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 16, right: 16, left: 50, bottom: 40 }}
            background={{ fill: 'var(--bg-surface)' }}
          >
            {/* Custom grid lines */}
            <CartesianGrid 
              strokeDasharray="none" 
              stroke="#1C2537" 
              opacity={0.3}
              horizontal={true}
              vertical={false}
            />
            
            {/* Axes */}
            <XAxis 
              dataKey="week" 
              tick={{ 
                fill: '#6B7A99', 
                fontSize: 10, 
                fontFamily: 'DM Mono'
              }} 
              axisLine={{ stroke: '#1C2537' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ 
                fill: '#6B7A99', 
                fontSize: 10, 
                fontFamily: 'DM Mono'
              }}
              axisLine={{ stroke: '#1C2537' }}
              tickLine={false}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Spike zones */}
            {spikeZones.map((zone, i) => (
              <ReferenceArea
                key={i}
                x1={zone.startWeek}
                x2={zone.endWeek}
                fill="#FF3D5A"
                fillOpacity={0.1}
                stroke="none"
              />
            ))}
            
            {/* Timeline markers */}
            {timelineMarkers.map((marker, i) => (
              <ReferenceLine
                key={i}
                x={marker.week}
                stroke="#00D4FF"
                strokeDasharray="4 4"
                strokeWidth={1}
                opacity={0.5}
                label={{
                  value: marker.name,
                  fill: '#00D4FF',
                  fontSize: 9,
                  fontFamily: 'DM Mono',
                  position: 'top'
                }}
              />
            ))}
            
            {/* Feature lines */}
            {lines.map((f, index) => (
              <Line
                key={f}
                type="monotone"
                dataKey={f}
                stroke={FEATURE_COLORS[f]}
                strokeWidth={activeFeature === f ? 2.5 : 1.5}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  strokeWidth: 2, 
                  stroke: '#080C14',
                  fill: FEATURE_COLORS[f]
                }}
                connectNulls
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={index * 100}
                opacity={activeFeature && activeFeature !== f ? 0.3 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* What Changed Strip */}
      <div className="border-t border-border pt-4">
        <div className="section-label mb-2">WHAT CHANGED THIS WEEK</div>
        <div className="flex flex-wrap gap-2">
          {[
            { feature: 'app_performance', trend: 'up', color: '#00E5A0' },
            { feature: 'ui_ux', trend: 'down', color: '#FF3D5A' },
            { feature: 'customer_service', trend: 'stable', color: '#6B7A99' },
            { feature: 'delivery', trend: 'up', color: '#00E5A0' },
            { feature: 'pricing', trend: 'stable', color: '#6B7A99' }
          ].map((item, index) => (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="chip flex items-center gap-1"
            >
              <span className="text-xs font-mono">{labelFeature(item.feature)}</span>
              <span 
                className="text-sm"
                style={{ color: item.color }}
              >
                {item.trend === 'up' ? 'â' : item.trend === 'down' ? 'â' : 'â'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs font-mono text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-accent-cyan" />
          <span>Product Updates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 bg-negative/20 rounded-industrial border border-negative/30" />
          <span>Spike Zones</span>
        </div>
      </div>
    </div>
  );
}
