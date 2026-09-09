export default function Loading() {
  return (
    <main className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="h-7 w-32 rounded-lg bg-slate-200 animate-pulse" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
            <div className="h-7 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 h-48 animate-pulse" />

      {/* Cost rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
