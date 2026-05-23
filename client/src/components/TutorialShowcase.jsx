import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── slide definitions ────────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'welcome',
    tag: 'Introduction',
    title: 'Welcome to PRISM',
    subtitle: 'Customer Review Intelligence Platform',
    body: 'PRISM aggregates and analyzes thousands of customer reviews across Amazon, Flipkart, JioMart and Brand Stores — giving your team real-time, AI-powered insights into product health and customer sentiment.',
    accent: '#6366f1',
    accentGlow: 'rgba(99,102,241,0.35)',
    visual: <WelcomeVisual />,
  },
  {
    id: 'health',
    tag: 'Health Score',
    title: 'Product Health Score',
    subtitle: 'AI-computed composite metric',
    body: 'Each product receives a 0–100 health score computed from embedding-weighted sentiment across all features. The score updates as new reviews arrive — giving you a single number to track product reputation over time.',
    accent: '#22c55e',
    accentGlow: 'rgba(34,197,94,0.3)',
    visual: <HealthVisual />,
  },
  {
    id: 'sentiment',
    tag: 'Feature Sentiment',
    title: 'Sentiment by Feature',
    subtitle: 'Drill down to what customers love or hate',
    body: 'Feature tags (Battery Life, Build Quality, Camera, etc.) are extracted using sentence embeddings. Click any feature bar to filter the trend chart, review graph, and drilldown panel — giving you laser-focused context on any topic.',
    accent: '#38bdf8',
    accentGlow: 'rgba(56,189,248,0.3)',
    visual: <SentimentVisual />,
  },
  {
    id: 'trends',
    tag: 'Weekly Trends',
    title: 'Sentiment Over Time',
    subtitle: 'Track momentum with weekly charts',
    body: 'The Trends panel shows week-by-week sentiment curves for every feature. Spot when a firmware update hurt battery ratings, or when a marketing campaign boosted perceived value — all without reading a single review manually.',
    accent: '#f59e0b',
    accentGlow: 'rgba(245,158,11,0.3)',
    visual: <TrendVisual />,
  },
  {
    id: 'graph',
    tag: 'Semantic Graph',
    title: 'Semantic Similarity Network',
    subtitle: 'Understand how topics cluster',
    body: 'The graph network visualises how review topics relate to each other using semantic embeddings. Drag nodes to explore, scroll to zoom, and hover edges to see similarity weights — uncovering hidden connections across customer feedback.',
    accent: '#a78bfa',
    accentGlow: 'rgba(167,139,250,0.35)',
    visual: <GraphVisual />,
  },
  {
    id: 'alerts',
    tag: 'Alerts',
    title: 'Real-Time Alert Center',
    subtitle: 'Never miss a critical sentiment drop',
    body: 'PRISM fires alerts when a feature\'s weekly negative sentiment exceeds your threshold — and pushes them via Slack webhook. Configure per-product alert rules and get notified the instant something goes wrong.',
    accent: '#f43f5e',
    accentGlow: 'rgba(244,63,94,0.35)',
    visual: <AlertVisual />,
  },
  {
    id: 'platforms',
    tag: 'Platform Filter',
    title: 'Multi-Platform Comparison',
    subtitle: 'Amazon vs Flipkart vs JioMart',
    body: 'Toggle between platforms to compare how sentiment differs across marketplaces. Every chart and metric responds instantly — letting you identify platform-specific issues and benchmark your product across distribution channels.',
    accent: '#fb923c',
    accentGlow: 'rgba(251,146,60,0.3)',
    visual: <PlatformVisual />,
  },
  {
    id: 'export',
    tag: 'Export',
    title: 'One-Click PDF Export',
    subtitle: 'Boardroom-ready reports in seconds',
    body: 'Generate a polished PDF report containing health scores, feature sentiment bars, weekly trends, and ranked issues — pre-formatted for executive presentations. Select product and platform, then click Export.',
    accent: '#14b8a6',
    accentGlow: 'rgba(20,184,166,0.3)',
    visual: <ExportVisual />,
  },
];

/* ─── decorative visuals ───────────────────────────────────────────────── */

function WelcomeVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #f59e0b, #22c55e, #38bdf8, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0a0c1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Orbitron",sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '0.1em' }}>P</span>
        </div>
      </motion.div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Amazon', 'Flipkart', 'JioMart', 'Brand Store'].map((p, i) => (
          <motion.span
            key={p}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.08em',
            }}
          >{p}</motion.span>
        ))}
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '180px' }}
        transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
        style={{ height: '2px', background: 'linear-gradient(to right, transparent, #6366f1, transparent)', borderRadius: '999px' }}
      />
    </div>
  );
}

function HealthVisual() {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setVal(78), 300);
    return () => clearTimeout(t);
  }, []);
  const color = val >= 70 ? '#22c55e' : val >= 45 ? '#f59e0b' : '#f43f5e';
  const circumference = 2 * Math.PI * 36;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r="36"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (val / 100) * circumference }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="50" y="55" textAnchor="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="Inter,sans-serif">{val}</text>
      </svg>
      <div style={{ display: 'flex', gap: '16px' }}>
        {[['Healthy', '#22c55e', '≥70'], ['Fair', '#f59e0b', '45–69'], ['Poor', '#f43f5e', '<45']].map(([label, c, range]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, margin: '0 auto 4px', boxShadow: `0 0 6px ${c}` }} />
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>{range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentVisual() {
  const features = [
    { name: 'Battery Life', pos: 82, neg: 18, color: '#22c55e' },
    { name: 'Build Quality', pos: 65, neg: 35, color: '#38bdf8' },
    { name: 'Camera', pos: 91, neg: 9, color: '#a78bfa' },
    { name: 'Packaging', pos: 54, neg: 46, color: '#f59e0b' },
    { name: 'Customer Support', pos: 37, neg: 63, color: '#f43f5e' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {features.map(({ name, pos, color }, i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ width: '90px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right', letterSpacing: '0.04em', flexShrink: 0 }}>{name}</span>
          <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pos}%` }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: '999px', background: color, boxShadow: `0 0 8px ${color}80` }}
            />
          </div>
          <span style={{ width: '28px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{pos}%</span>
        </motion.div>
      ))}
    </div>
  );
}

function TrendVisual() {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  const lines = [
    { color: '#22c55e', vals: [60, 65, 70, 68, 72, 75, 78] },
    { color: '#38bdf8', vals: [50, 52, 48, 55, 58, 54, 60] },
    { color: '#f43f5e', vals: [40, 38, 35, 30, 32, 28, 25] },
  ];
  const W = 200, H = 80;
  const toX = (i) => (i / (weeks.length - 1)) * W;
  const toY = (v) => H - ((v - 20) / 60) * H;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {lines.map(({ color, vals }, li) => {
          const d = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
          return (
            <motion.path
              key={li}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 + li * 0.2, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '12px' }}>
        {[['Battery', '#22c55e'], ['Build', '#38bdf8'], ['Support', '#f43f5e']].map(([label, c]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '2px', background: c, borderRadius: '999px', boxShadow: `0 0 4px ${c}` }} />
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphVisual() {
  const nodes = [
    { x: 100, y: 55, r: 14, color: '#a78bfa', label: 'Battery' },
    { x: 165, y: 30, r: 10, color: '#38bdf8', label: 'Charging' },
    { x: 170, y: 85, r: 8, color: '#22c55e', label: 'Build' },
    { x: 45, y: 30, r: 10, color: '#f59e0b', label: 'Camera' },
    { x: 40, y: 80, r: 8, color: '#f43f5e', label: 'Support' },
    { x: 100, y: 105, r: 7, color: '#ec4899', label: 'Value' },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[3,4]];
  return (
    <svg width="210" height="130" viewBox="0 0 210 130" style={{ overflow: 'visible' }}>
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.08 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.g key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 200 }}>
          <circle cx={n.x} cy={n.y} r={n.r + 3} fill={`${n.color}25`} />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} style={{ filter: `drop-shadow(0 0 5px ${n.color})` }} />
          <text x={n.x} y={n.y + n.r + 9} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5">{n.label}</text>
        </motion.g>
      ))}
    </svg>
  );
}

function AlertVisual() {
  const alerts = [
    { label: 'Battery sentiment dropped below 35%', severity: 'critical', color: '#f43f5e', time: '2m ago' },
    { label: 'Build Quality negative spike detected', severity: 'warning', color: '#f59e0b', time: '18m ago' },
    { label: 'Slack notification sent', severity: 'info', color: '#38bdf8', time: '18m ago' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {alerts.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.15 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: `${a.color}15`,
            border: `1px solid ${a.color}35`,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, boxShadow: `0 0 6px ${a.color}`, marginTop: 3, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{a.label}</div>
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{a.time}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PlatformVisual() {
  const platforms = [
    { name: 'Amazon', score: 74, color: '#f59e0b' },
    { name: 'Flipkart', score: 68, color: '#38bdf8' },
    { name: 'JioMart', score: 81, color: '#22c55e' },
  ];
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', justifyContent: 'center' }}>
      {platforms.map(({ name, score, color }, i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{score}</span>
          <div style={{ width: '36px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px 6px 0 0', overflow: 'hidden', height: '70px', display: 'flex', alignItems: 'flex-end' }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${score}%` }}
              transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
              style={{ width: '100%', background: color, boxShadow: `0 0 10px ${color}60`, borderRadius: '6px 6px 0 0' }}
            />
          </div>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{name}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ExportVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100px', height: '120px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '10px',
          display: 'flex', flexDirection: 'column', gap: '5px',
        }}
      >
        {[100, 70, 85, 60, 90, 50].map((w, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
            style={{
              height: '7px',
              width: `${w}%`,
              borderRadius: '999px',
              background: i === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f43f5e' }} />
          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>PDF Report</div>
        </div>
      </motion.div>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
          border: 'none',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'default',
          boxShadow: '0 0 16px rgba(20,184,166,0.4)',
        }}
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
          <path d="M5 0v8M1 5l4 4 4-4M0 11h10" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        Export PDF
      </motion.button>
    </div>
  );
}

/* ─── progress bar ─────────────────────────────────────────────────────── */
function ProgressBar({ current, total, accent }) {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? '24px' : '6px',
            background: i === current ? accent : 'rgba(255,255,255,0.15)',
          }}
          transition={{ duration: 0.3 }}
          style={{ height: '4px', borderRadius: '999px' }}
        />
      ))}
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────────────── */
export default function TutorialShowcase({ onClose }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const slide = SLIDES[idx];

  const go = useCallback((next) => {
    setDir(next > idx ? 1 : -1);
    setIdx(next);
  }, [idx]);

  const prev = useCallback(() => { if (idx > 0) go(idx - 1); }, [idx, go]);
  const next = useCallback(() => { if (idx < SLIDES.length - 1) go(idx + 1); }, [idx, go]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 60 : -60, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -60 : 60, scale: 0.97 }),
  };

  return (
    <motion.div
      key="showcase-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* CSS */}
      <style>{`
        @keyframes sc-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .sc-nav-btn:hover { opacity:1 !important; transform:scale(1.08); }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(95vw, 760px)',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, rgba(15,17,35,0.98) 0%, rgba(8,10,22,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px ${slide.accentGlow}`,
          transition: 'box-shadow 0.5s ease',
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: '"Orbitron",sans-serif', fontWeight: 800,
              fontSize: '0.85rem', letterSpacing: '0.2em', color: '#fff', opacity: 0.85,
            }}>PRISM</span>
            <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>PLATFORM TOUR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ProgressBar current={idx} total={SLIDES.length} accent={slide.accent} />
            <button
              onClick={onClose}
              id="showcase-close"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: '30px', height: '30px',
                color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >✕</button>
          </div>
        </div>

        {/* Slide body */}
        <div style={{ display: 'flex', minHeight: '320px' }}>
          {/* Content left */}
          <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', minWidth: 0 }}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={slide.id + '-content'}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {/* Tag */}
                <motion.span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: `${slide.accent}20`,
                  border: `1px solid ${slide.accent}45`,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: slide.accent,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  width: 'fit-content',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: slide.accent, boxShadow: `0 0 5px ${slide.accent}` }} />
                  {slide.tag}
                </motion.span>

                {/* Title */}
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)',
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}>{slide.title}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: slide.accent, fontWeight: 500, opacity: 0.85 }}>{slide.subtitle}</p>
                </div>

                {/* Body */}
                <p style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.7,
                  maxWidth: '360px',
                }}>{slide.body}</p>

                {/* Slide number */}
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
                  {String(idx + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Visual right */}
          <div style={{
            width: '260px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
          }}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={slide.id + '-visual'}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {slide.visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Slide dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                title={s.tag}
                style={{
                  width: i === idx ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: i === idx ? slide.accent : 'rgba(255,255,255,0.18)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s',
                  boxShadow: i === idx ? `0 0 8px ${slide.accent}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={prev}
              disabled={idx === 0}
              className="sc-nav-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                opacity: idx === 0 ? 0.3 : 0.7,
                transition: 'all 0.2s',
              }}
            >
              ← Prev
            </button>
            {idx < SLIDES.length - 1 ? (
              <button
                onClick={next}
                className="sc-nav-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`,
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: 0.9,
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 16px ${slide.accentGlow}`,
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="sc-nav-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  background: `linear-gradient(135deg, #22c55e, #16a34a)`,
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: 0.9,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                }}
              >
                ✓ Get Started
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
