import { motion } from 'framer-motion';

const cfg = {
  green: { bar: 'bg-emerald-500', label: 'Act immediately' },
  yellow: { bar: 'bg-yellow-500', label: 'Monitor' },
  red: { bar: 'bg-red-500', label: 'Gather more data' },
};

export default function ConfidenceMeter({ level, value }) {
  const c = cfg[level] || cfg.red;
  const pct = Math.round((value ?? 0) * 100);

  return (
    <div className="mt-2">
      <div className="mb-0.5 flex justify-between text-[10px] text-slate-500">
        <span>Confidence</span>
        <span>{c.label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={`h-full ${c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.1 }}
        />
      </div>
    </div>
  );
}
