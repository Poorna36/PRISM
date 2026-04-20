import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { runDemoPipeline, setGeminiKey, getGeminiKeyStatus } from '../../api';
import { PRODUCTS } from '../../constants/products';

/* ── Stage metadata ──────────────────────────────────────────────── */
const STAGE_META = {
  1: { icon: '🔤', color: '#00D4FF', loadText: 'Cleaning & translating review text…', name: 'Normalization' },
  2: { icon: '🛡️', color: '#A78BFA', loadText: 'Running spam & bot detection…', name: 'Trust Filter' },
  3: { icon: '🔍', color: '#00E5A0', loadText: 'Extracting product feature signals…', name: 'Feature Extraction' },
  4: { icon: '🕸️', color: '#F472B6', loadText: 'Building knowledge graph connections…', name: 'Graph Integration' },
  5: { icon: '📈', color: '#FF6B35', loadText: 'Analyzing weekly sentiment trends…', name: 'Time-Series Analysis' },
  6: { icon: '🎯', color: '#FACC15', loadText: 'Scoring insight confidence levels…', name: 'Confidence Scoring' },
  7: { icon: '✉️', color: '#00D4FF', loadText: 'Generating AI follow-up questions…', name: 'Adaptive Feedback' },
};

const SAMPLE_REVIEW = {
  product_id: 'prod_001', platform: 'amazon',
  review_text: 'Sound is great but battery dies in 3 hours ANC on. Box arrived crushed, very disappointed with packaging.',
  rating: 2, user_id: 'demo_user_1', email: 'judge@example.com', media_type: 'none',
  timestamp: new Date().toISOString(),
};

function nameForProduct(id) {
  return PRODUCTS.find(p => p.product_id === id)?.name || id;
}

/* ── Stage summary builders ──────────────────────────────────────── */
function stageSummary(n, st) {
  if (!st || st.status === 'running') return null;
  switch (n) {
    case 1: {
      const lang = st.result?.detected_language || st.detected_language || '?';
      return `Language: ${lang} → English`;
    }
    case 2: {
      const pass = st.result?.pass ?? st.pass;
      if (pass === false) return `⚠ Flagged: ${st.result?.reason || st.reason || 'trust layer'}`;
      return 'Trust: ✓ Passed';
    }
    case 3: {
      const feats = st.features || st.result?.features || {};
      const keys = Object.keys(feats);
      if (!keys.length) return 'No features detected';
      return keys.map(k => {
        const s = feats[k]?.sentiment;
        return `${k.replace(/_/g, ' ')} ${s === 'positive' ? '⊕' : '⊖'}`;
      }).join(' · ');
    }
    case 4: {
      const r = st.result || {};
      return `${r.edges_created ?? '—'} edges created`;
    }
    case 5: {
      const r = st.result || {};
      const spikes = r.spikes?.length ?? 0;
      return `${spikes} spike${spikes !== 1 ? 's' : ''} detected`;
    }
    case 6: {
      const r = st.result || {};
      return `Health: ${r.health_score ?? '—'} · ${r.insights_updated ?? '—'} insights`;
    }
    case 7: {
      return st.detail || 'Survey dispatched';
    }
    default: return JSON.stringify(st).slice(0, 120);
  }
}

/* ── Shimmer bar ─────────────────────────────────────────────────── */
function ShimmerBar({ color }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-industrial" style={{ background: `${color}20` }}>
      <motion.div className="h-full rounded-industrial" style={{ background: color }}
        initial={{ width: '0%', x: 0 }} animate={{ width: '60%', x: ['0%', '66%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

/* ── New Review Alert Toast ──────────────────────────────────────── */
function ReviewAlertToast({ alerts }) {
  return (
    <AnimatePresence>
      {alerts.map((a, i) => (
        <motion.div key={a.id || i}
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="mb-2 flex items-center gap-3 card px-4 py-3 glow-cyan"
        >
          <span className="text-lg">ðŸ”¥</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-accent-cyan">New review from {a.platform}</p>
            <p className="truncate text-[11px] text-text-secondary">
              {nameForProduct(a.product_id)} · {'â˜…'.repeat(a.rating)}{'â˜…'.repeat(5 - a.rating)} · {(a.preview_text || '').slice(0, 80)}â¦
            </p>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

/* ── Gemini Key Modal ────────────────────────────────────────────── */
function GeminiKeyModal({ onClose, onSaved }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (key.trim().length < 10) { setErr('Key too short'); return; }
    setSaving(true); setErr('');
    try {
      const r = await setGeminiKey(key.trim());
      if (!r.ok) throw new Error('Failed');
      onSaved(); onClose();
    } catch { setErr('Failed to save key'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="mx-4 w-full max-w-md card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold text-text-primary text-lg">ð Gemini API Key</h3>
        <p className="mt-2 text-sm text-text-secondary">Enter your Google Gemini API key to enable AI-powered context-aware survey generation.</p>
        <div className="mt-4 flex items-center gap-2 bg-bg-elevated rounded-industrial border border-border px-3 py-2">
          <input type={show ? 'text' : 'password'} value={key} onChange={e => setKey(e.target.value)}
            placeholder="AIzaSy..." className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary" />
          <button type="button" onClick={() => setShow(!show)} className="text-xs text-text-secondary hover:text-text-primary">{show ? 'Hide' : 'Show'}</button>
        </div>
        {err && <p className="mt-2 text-xs text-negative">{err}</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={save} disabled={saving}
            className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50">
            {saving ? 'Savingâ¦' : 'Validate & Save'}
          </button>
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Stage Card ──────────────────────────────────────────────────── */
function StageCard({ n, st, surveySummary }) {
  const meta = STAGE_META[n];
  const active = !!st;
  const isRunning = st?.status === 'running';
  const isDone = st && st.status !== 'running';
  const summary = stageSummary(n, st);

  // Stage 7 special rendering
  if (n === 7 && isDone) {
    const sent = st?.status === 'sent' || isDone;
    const email = st?.respondent_email || 'â';
    const features = st?.gemini_feature_focus || [];
    const showSummary = surveySummary && sent &&
      (!st?.respondent_email || surveySummary.respondent_email === st.respondent_email);

    return (
      <motion.div initial={false}
        animate={{ opacity: active ? 1 : 0.4, borderColor: active ? `${meta.color}66` : '#1C2537' }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative overflow-hidden card p-4">
        <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(circle at top right, ${meta.color}, transparent 70%)` }} />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-industrial text-lg" style={{ background: `${meta.color}20` }}>{meta.icon}</span>
              <div>
                <span className="text-xs font-semibold text-text-secondary font-mono">Stage {n}</span>
                <p className="text-sm font-medium text-text-primary font-display">{meta.name}</p>
              </div>
            </div>
            <span className="chip chip-active text-[10px] font-medium">â delivered</span>
          </div>
          <div className="mt-3 space-y-2 text-xs text-text-secondary">
            <p><span className="text-text-secondary">Sent to:</span> <span className="text-accent-cyan">{email}</span></p>
            {features.length > 0 && (
              <p><span className="text-text-secondary">AI focus:</span> <span className="text-text-primary">{features.join(', ')}</span></p>
            )}
            <div className="my-2 border-t border-border" />
            {!showSummary && (
              <div className="flex items-center gap-2">
                <motion.span className="inline-block h-2 w-2 rounded-full bg-accent-cyan"
                  animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
                <span className="text-accent-cyan/90">Awaiting consumer responseâ¦</span>
              </div>
            )}
            {showSummary && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-positive">Response received</p>
                <p className="text-sm leading-relaxed text-text-primary">{surveySummary.summary}</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={false}
      animate={{ opacity: active ? 1 : 0.4, borderColor: active ? `${meta.color}66` : '#1C2537' }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative overflow-hidden card p-4">
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(circle at top right, ${meta.color}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-industrial text-lg" style={{ background: `${meta.color}20` }}>{meta.icon}</span>
            <div>
              <span className="text-xs font-semibold text-text-secondary font-mono">Stage {n}</span>
              <p className="text-sm font-medium text-text-primary font-display">{meta.name}</p>
            </div>
          </div>
          {isDone && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: `${meta.color}20`, color: meta.color }}>â</motion.span>
          )}
        </div>

        {isRunning && (
          <>
            <p className="mt-3 text-xs text-text-secondary">{meta.loadText}</p>
            <ShimmerBar color={meta.color} />
          </>
        )}

        {isDone && summary && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-3 bg-bg-elevated rounded-industrial px-3 py-2 text-xs leading-relaxed text-text-secondary border border-border">
            {summary}
          </motion.div>
        )}

        {!active && <p className="mt-3 text-xs text-text-secondary">Waiting for pipeline runâ¦</p>}
      </div>
    </motion.div>
  );
}

/* Main DemoCenter */
export default function DemoCenter({ onHealthDelta, leaderboard = [], productNames = {} }) {
  const [running, setRunning] = useState(false);
  const [stageState, setStageState] = useState({});
  const [doneInfo, setDoneInfo] = useState(null);
  const [error, setError] = useState(null);
  const [surveySummary, setSurveySummary] = useState(null);
  const [reviewAlerts, setReviewAlerts] = useState([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(null);
  const [customReview, setCustomReview] = useState(SAMPLE_REVIEW.review_text);
  const [customRating, setCustomRating] = useState(SAMPLE_REVIEW.rating);
  const alertTimeout = useRef(null);

  // Check Gemini key status on mount
  useEffect(() => {
    getGeminiKeyStatus().then(r => r.json()).then(d => setKeyConfigured(d.configured)).catch(() => {});
  }, []);

  async function run() {
    const reviewToRun = {
      ...SAMPLE_REVIEW,
      review_text: customReview,
      rating: customRating
    };

    setRunning(true); setStageState({}); setDoneInfo(null); setError(null); setSurveySummary(null);

    try {
      const res = await runDemoPipeline(reviewToRun);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Demo request failed'); }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const rawBlock = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          let eventName = 'message';
          const dataParts = [];
          for (const line of rawBlock.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataParts.push(line.slice(5).trim());
          }
          const dataStr = dataParts.join('');
          if (!dataStr) continue;
          let data;
          try { data = JSON.parse(dataStr); } catch { continue; }

          if (eventName === 'stage' && data?.stage) {
            setStageState(s => ({ ...s, [data.stage]: { ...data, at: Date.now() } }));
          }
          if (eventName === 'done') {
            setDoneInfo(data);
            if (data?.insight_delta?.health_score != null && onHealthDelta) onHealthDelta(data.insight_delta.health_score);
          }
          if (eventName === 'error') setError(data?.message || 'Pipeline error');
        }
      }
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setRunning(false); }
  }

  const activeStageCount = Object.keys(stageState).length;
  const progress = running ? Math.round((activeStageCount / 7) * 100) : doneInfo ? 100 : 0;

  return (
    <section id="demo-center" className="card">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">DEMO CENTER</p>
              <h3 className="font-display font-semibold text-text-primary text-sm">
                Live intelligence pipeline
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {keyConfigured === true && (
                <span className="chip chip-active">ð Gemini active</span>
              )}
              {keyConfigured === false && (
                <button onClick={() => setShowKeyModal(true)}
                  className="chip text-accent-orange hover:text-accent-orange/80">
                  ð Set Gemini key
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Review Alert Toasts */}
          {reviewAlerts.length > 0 && <ReviewAlertToast alerts={reviewAlerts} />}

          {/* Review Input Form */}
          <div className="space-y-4">
            <p className="text-xs font-mono text-text-secondary uppercase tracking-[0.15em]">
              CUSTOM REVIEW INPUT
            </p>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-mono text-text-secondary mb-2 block">
                  Review Text
                </label>
                <textarea
                  value={customReview}
                  onChange={(e) => setCustomReview(e.target.value)}
                  className="w-full bg-bg-elevated border border-border rounded-industrial p-3 text-xs text-text-primary font-mono resize-none h-20 outline-none focus:border-accent-cyan transition-all"
                  placeholder="Enter a review to process through the pipeline..."
                />
              </div>
              <div>
                <label className="text-xs font-mono text-text-secondary mb-2 block">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setCustomRating(star)}
                      className={`text-lg transition-all ${star <= customRating ? 'text-accent-orange' : 'text-border hover:text-accent-orange/50'}`}
                    >
                      â
                    </button>
                  ))}
                  <span className="text-xs font-mono text-text-secondary ml-2">
                    {customRating} / 5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={run} disabled={running}
              className="btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
              {running ? 'Running pipelineâ¦' : 'â Run live pipeline demo'}
            </button>
            <button type="button" onClick={() => setShowKeyModal(true)}
              className="btn-secondary px-4 py-2 text-xs">
              ð API Key
            </button>
            {error && <span className="text-sm text-negative">{error}</span>}
          </div>

          {/* Progress bar */}
          {(running || doneInfo) && (
            <div className="h-1.5 overflow-hidden rounded-industrial bg-bg-elevated">
              <motion.div className="h-full rounded-industrial bg-gradient-to-r from-accent-cyan to-accent-orange"
                initial={{ width: '0%' }} animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }} />
            </div>
          )}

          {/* Pipeline Stages */}
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <StageCard key={n} n={n} st={stageState[n]} surveySummary={surveySummary} />
            ))}
          </div>

          {/* Done banner */}
          {doneInfo && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 card glow-cyan">
              <span className="text-lg">â</span>
              <p className="text-sm text-accent-cyan">
                Pipeline complete
                {doneInfo.filtered ? ` â filtered: ${doneInfo.reason || 'trust layer'}` : ''}
                {doneInfo.insight_delta?.health_score != null ? ` Â· health score: ${doneInfo.insight_delta.health_score}` : ''}
              </p>
            </motion.div>
          )}

          {/* Mini leaderboard */}
          {leaderboard.length > 0 && (
            <div className="card">
              <p className="section-label mb-3">MINI LEADERBOARD</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {leaderboard.map((row, i) => (
                  <motion.div key={row.product_id} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between bg-bg-elevated rounded-industrial px-3 py-2 text-xs border border-border">
                    <span className="truncate text-text-primary">{productNames[row.product_id] || row.name}</span>
                    <span className="tabular-nums font-semibold text-accent-cyan">{row.health_score}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Gemini Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <GeminiKeyModal onClose={() => setShowKeyModal(false)}
            onSaved={() => setKeyConfigured(true)} />
        )}
      </AnimatePresence>
    </section>
  );
}
