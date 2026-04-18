import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchReviews } from '../../api';
import { labelFeature } from '../../constants/features';

export default function ReviewDrilldown({ productId, activeFeature }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [productId, activeFeature]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReviews(productId, { page, limit: 12, feature: activeFeature || undefined })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then((j) => {
        if (!cancelled) {
          setData(j);
          setErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, page, activeFeature]);

  const totalPages = data ? Math.max(1, Math.ceil((data.total || 0) / 12)) : 1;

  return (
    <div className="panel p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="section-label">Evidence</p>
          <h3 className="text-sm font-semibold text-slate-100">Review drill-down</h3>
        </div>
        {activeFeature && (
          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
            Filter: {labelFeature(activeFeature)}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}

      <AnimatePresence mode="wait">
        {!loading && data && (
          <motion.ul
            key={`${page}-${activeFeature}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-80 space-y-2 overflow-y-auto pr-1"
          >
            {data.reviews?.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2 text-slate-500">
                  <span className="uppercase">{r.platform}</span>
                  <span>·</span>
                  <span>{r.rating}★</span>
                  <span>·</span>
                  <span>{r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''}</span>
                </div>
                <p className="mt-1 text-slate-200">{r.review_text || r.transcript || '—'}</p>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {data && data.total === 0 && !loading && (
        <p className="text-sm text-slate-500">No reviews match this filter.</p>
      )}

      {data && data.total > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-md bg-slate-800 px-2 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages} · {data.total} total
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded-md bg-slate-800 px-2 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
