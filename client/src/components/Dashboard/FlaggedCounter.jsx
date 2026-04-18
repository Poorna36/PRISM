export default function FlaggedCounter({ count }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
      <span className="font-semibold tabular-nums">{count ?? 0}</span> reviews flagged and excluded
    </div>
  );
}
