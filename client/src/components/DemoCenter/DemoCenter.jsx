import { useState } from 'react';
import { motion } from 'framer-motion';
import { runDemoPipeline } from '../../api';

const STAGES = [
  { n: 1, name: 'Normalization' },
  { n: 2, name: 'Trust Filter' },
  { n: 3, name: 'Feature Extraction' },
  { n: 4, name: 'Graph Integration' },
  { n: 5, name: 'Time-Series Analysis' },
  { n: 6, name: 'Confidence Scoring' },
  { n: 7, name: 'Adaptive Feedback' },
];

const SAMPLE_REVIEW = {
  product_id: 'prod_001',
  platform: 'amazon',
  review_text:
    'Sound is great but battery dies in 3 hours ANC on. Box arrived crushed, very disappointed with packaging.',
  rating: 2,
  user_id: 'demo_user_1',
  media_type: 'none',
  timestamp: new Date().toISOString(),
};

export default function DemoCenter({ onHealthDelta, leaderboard = [], productNames = {} }) {
  const [running, setRunning] = useState(false);
  const [stageState, setStageState] = useState({});
  const [doneInfo, setDoneInfo] = useState(null);
  const [error, setError] = useState(null);

  async function run() {
    setRunning(true);
    setStageState({});
    setDoneInfo(null);
    setError(null);

    try {
      const res = await runDemoPipeline(SAMPLE_REVIEW);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Demo request failed');
      }

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
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (eventName === 'stage' && data?.stage) {
            setStageState((s) => ({
              ...s,
              [data.stage]: { ...data, at: Date.now() },
            }));
          }
          if (eventName === 'done') {
            setDoneInfo(data);
            if (data?.insight_delta?.health_score != null && onHealthDelta) {
              onHealthDelta(data.insight_delta.health_score);
            }
          }
          if (eventName === 'error') {
            setError(data?.message || 'Pipeline error');
          }
        }
      }
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <section id="demo-center" className="mt-16 scroll-mt-8 border-t border-slate-800 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-white">Demo Center</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Stream a sample review through the seven pipeline stages (SSE). Cards light up in sequence — explainability
          for Stage 3 shows embedding-based feature tagging, matching INSIGHTS.md.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 disabled:opacity-50"
          >
            {running ? 'Running pipeline…' : 'Run live pipeline demo'}
          </button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {STAGES.map((s) => {
            const st = stageState[s.n];
            const active = !!st;
            return (
              <motion.div
                key={s.n}
                initial={false}
                animate={{
                  opacity: active ? 1 : 0.45,
                  scale: active ? 1 : 0.98,
                  borderColor: active ? 'rgba(56, 189, 248, 0.5)' : 'rgba(51, 65, 85, 1)',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, delay: active ? 0 : 0 }}
                className="rounded-xl border bg-slate-900/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-sky-300">
                    {s.n}
                  </span>
                  <span className="text-xs text-slate-500">{s.name}</span>
                </div>
                {st?.status === 'running' && (
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className="h-full bg-sky-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
                    />
                  </div>
                )}
                {st && st.status === 'done' && (
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] leading-relaxed text-slate-300">
                    {JSON.stringify(st, null, 2)}
                  </pre>
                )}
              </motion.div>
            );
          })}
        </div>

        {doneInfo && (
          <motion.p
            className="mt-6 text-sm text-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Pipeline complete
            {doneInfo.filtered ? ` — filtered: ${doneInfo.reason || 'trust layer'}` : ''}
            {doneInfo.insight_delta?.health_score != null
              ? ` · health score snapshot: ${doneInfo.insight_delta.health_score}`
              : ''}
          </motion.p>
        )}

        {leaderboard.length > 0 && (
          <div className="mt-10 rounded-xl border border-slate-700 bg-slate-900/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mini leaderboard (live from /dashboard/all)
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {leaderboard.map((row, i) => (
                <motion.div
                  key={row.product_id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 py-2 text-xs"
                >
                  <span className="truncate text-slate-200">
                    {productNames[row.product_id] || row.name}
                  </span>
                  <span className="tabular-nums font-semibold text-sky-300">{row.health_score}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
