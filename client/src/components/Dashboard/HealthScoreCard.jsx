import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export default function HealthScoreCard({ score, productName }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 95, damping: 24 });
  const [display, setDisplay] = useState(0);
  const widthPct = useTransform(spring, (v) => `${Math.min(100, Math.max(0, v))}%`);

  useEffect(() => {
    if (score == null) return;
    mv.set(0);
    mv.set(score);
  }, [score, mv]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  const hue = (display || 0) >= 75 ? 142 : (display || 0) >= 55 ? 48 : 0;

  return (
    <motion.div
      layout
      className="panel relative overflow-hidden p-4 shadow-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: `hsl(${hue} 70% 45%)` }}
      />
      <p className="section-label">Health score</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{productName}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-bold tabular-nums tracking-tight text-white">{display}</span>
        <span className="mb-1 text-xs text-slate-500">/ 100</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: widthPct,
            background: `linear-gradient(90deg, hsl(${hue - 20} 65% 42%), hsl(${hue} 70% 50%))`,
          }}
        />
      </div>
    </motion.div>
  );
}
