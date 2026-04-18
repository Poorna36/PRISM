import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { fetchAlerts } from '../../api';
import { labelFeature } from '../../constants/features';

export default function AlertCenter({ productId }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());

  const load = useCallback(async () => {
    const res = await fetchAlerts();
    if (res.ok) {
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      withCredentials: true,
    });
    socket.on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    });
    return () => socket.disconnect();
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id) && (!productId || a.product_id === productId));

  function dismiss(id) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  return (
    <div className="panel border-red-500/25 bg-red-950/15 p-4 shadow-panel">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-400/90">Alerts</p>
      <h3 className="mb-2 text-sm font-semibold text-red-100">Real-time</h3>
      <p className="mb-3 text-xs text-red-200/70">
        Fires when weekly negative sentiment for a feature exceeds 60% (also pushed live via Socket.io).
      </p>
      <ul className="space-y-2">
        <AnimatePresence>
          {visible.length === 0 && (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500"
            >
              No active alerts.
            </motion.li>
          )}
          {visible.map((a) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start justify-between gap-2 rounded-lg border border-red-500/30 bg-slate-900/60 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-medium text-red-100">
                  {labelFeature(a.feature)} · {a.severity}
                </p>
                <p className="mt-0.5 text-slate-300">{a.message}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {a.triggered_at ? new Date(a.triggered_at).toLocaleString() : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(a.id)}
                className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700"
              >
                Dismiss
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
