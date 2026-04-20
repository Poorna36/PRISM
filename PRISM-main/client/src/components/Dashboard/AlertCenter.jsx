import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { fetchAlerts } from '../../api';
import { labelFeature, FEATURE_COLORS } from '../../constants/features';

function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-negative/20 text-negative border border-negative/30';
    case 'high': return 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30';
    case 'medium': return 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30';
    case 'low': return 'bg-text-secondary/20 text-text-secondary border border-text-secondary/30';
    default: return 'bg-text-secondary/20 text-text-secondary border border-text-secondary/30';
  }
}

export default function AlertCenter({ productId }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [isOpen, setIsOpen] = useState(false);

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

  // Mock alerts for demo
  const mockAlerts = [
    {
      id: 'alert_1',
      feature: 'app_performance',
      severity: 'Critical',
      message: 'Negative sentiment spike detected - 78% negative reviews this week',
      triggered_at: new Date(Date.now() - 1000000).toISOString()
    },
    {
      id: 'alert_2',
      feature: 'ui_ux',
      severity: 'High',
      message: 'Sustained negative trend over 3 weeks - design review recommended',
      triggered_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'alert_3',
      feature: 'delivery',
      severity: 'Medium',
      message: 'Regional delivery delays affecting customer satisfaction',
      triggered_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const displayAlerts = visible.length > 0 ? visible : mockAlerts.slice(0, 3 - visible.length);

  return (
    <>
      {/* Bell Icon in Top Bar */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 hover:bg-bg-elevated rounded-industrial transition-all"
        >
          <span className="text-xl">â</span>
          {displayAlerts.length > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-accent-orange rounded-full flex items-center justify-center text-xs font-mono text-bg-base"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {displayAlerts.length}
            </motion.div>
          )}
        </button>
      </div>

      {/* Floating Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-12 h-full w-80 bg-bg-surface border-l border-border z-50 shadow-2xl"
            >
              {/* Header */}
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="section-label">ALERT CENTER</p>
                    <h3 className="font-display font-semibold text-text-primary text-sm">
                      Real-time notifications
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-bg-elevated rounded-industrial transition-all"
                  >
                    <span className="text-text-secondary">â</span>
                  </button>
                </div>
              </div>

              {/* Alert List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-text-secondary font-mono">No active alerts</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {displayAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ delay: index * 0.1 }}
                        className="card p-3 hover:border-accent-cyan/50 transition-all"
                      >
                        {/* Alert Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`px-2 py-1 rounded-industrial text-xs font-mono ${getSeverityColor(alert.severity)}`}
                            >
                              {alert.severity}
                            </div>
                            <div className={`px-2 py-1 rounded-industrial text-xs font-mono`}
                              style={{ 
                                backgroundColor: `${FEATURE_COLORS[alert.feature]}20`,
                                color: FEATURE_COLORS[alert.feature]
                              }}
                            >
                              {labelFeature(alert.feature)}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => dismiss(alert.id)}
                            className="p-1 hover:bg-bg-elevated rounded-industrial transition-all"
                          >
                            <span className="text-text-secondary text-xs">â</span>
                          </button>
                        </div>

                        {/* Alert Message */}
                        <p className="text-xs text-text-secondary mb-2 leading-relaxed">
                          {alert.message}
                        </p>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-text-secondary">
                            {alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : ''}
                          </span>
                          
                          {/* Action Button */}
                          <button className="text-xs font-mono text-accent-cyan hover:text-accent-cyan/80 transition-all">
                            View Details â
                          </button>
                        </div>

                        {/* New Alert Indicator */}
                        {index === 0 && (
                          <motion.div
                            className="absolute top-3 right-3 w-2 h-2 bg-accent-orange rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <button className="text-xs font-mono text-text-secondary hover:text-accent-cyan transition-all">
                    Clear All Dismissed
                  </button>
                  <button className="text-xs font-mono text-accent-cyan hover:text-accent-cyan/80 transition-all">
                    Alert Settings â
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
