import { motion } from 'framer-motion';

export default function LiveReviewCounter({ count }) {
  return (
    <motion.div
      className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-center text-sm text-sky-100"
      initial={{ scale: 0.98 }}
      animate={{ scale: 1 }}
      key={count}
    >
      <span className="font-semibold tabular-nums">{count ?? 0}</span> reviews analyzed (this product)
    </motion.div>
  );
}
