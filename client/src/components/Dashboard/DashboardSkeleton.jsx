export default function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse" aria-hidden>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-xl bg-slate-800/60" />
        <div className="space-y-3">
          <div className="h-12 rounded-lg bg-slate-800/50" />
          <div className="h-12 rounded-lg bg-slate-800/50" />
          <div className="h-10 rounded-lg bg-slate-800/40" />
        </div>
      </div>
      <div className="h-24 rounded-xl bg-slate-800/40" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-80 rounded-xl bg-slate-800/40 xl:col-span-1" />
        <div className="space-y-6 xl:col-span-2">
          <div className="h-72 rounded-xl bg-slate-800/40" />
          <div className="h-80 rounded-xl bg-slate-800/40" />
        </div>
      </div>
    </div>
  );
}
