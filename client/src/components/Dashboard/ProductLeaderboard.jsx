import { motion } from 'framer-motion';
import { FEATURE_COLORS } from '../../constants/features';

const PALETTE = Object.values(FEATURE_COLORS);

export default function ProductLeaderboard({ items, selectedId, onSelect, nameById = {} }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">No products in leaderboard yet.</p>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ul className="space-y-1">
        {items.map((row, i) => {
          const active = row.product_id === selectedId;
          const label = nameById[row.product_id] || row.name;
          return (
            <motion.li key={row.product_id} layout>
              <button
                type="button"
                onClick={() => onSelect(row.product_id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? 'bg-sky-500/15 ring-1 ring-sky-500/40' : 'hover:bg-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-100">{label}</span>
                </span>
                <span className="tabular-nums text-slate-300">{row.health_score}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
