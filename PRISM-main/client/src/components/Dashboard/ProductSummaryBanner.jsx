import { motion } from 'framer-motion';

export default function ProductSummaryBanner({ text }) {
  return (
    <motion.div
      className="panel bg-gradient-to-r from-slate-900/90 to-slate-950/90 px-5 py-4 shadow-panel"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <p className="section-label">Narrative</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-200">{text || '—'}</p>
    </motion.div>
  );
}
