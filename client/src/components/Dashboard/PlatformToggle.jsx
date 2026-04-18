const PLATFORMS = [
  { id: '', label: 'All platforms' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
  { id: 'jiomart', label: 'JioMart' },
  { id: 'brand', label: 'Brand store' },
];

export default function PlatformToggle({ value, onChange, comparison }) {
  const scores = comparison || {};

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-surface px-3 py-2">
      <span className="text-xs font-medium text-slate-500">Platform</span>
      {PLATFORMS.map((p) => (
        <button
          key={p.id || 'all'}
          type="button"
          onClick={() => onChange(p.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            value === p.id
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {p.label}
          {p.id && scores[p.id]?.health_score != null && (
            <span className="ml-1.5 tabular-nums opacity-80">({scores[p.id].health_score})</span>
          )}
        </button>
      ))}
    </div>
  );
}
