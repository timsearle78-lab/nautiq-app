export default function Loading() {
  return (
    <main className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        <div className="h-9 w-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Inventory rows */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
