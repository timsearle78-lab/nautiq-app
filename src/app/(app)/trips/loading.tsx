export default function Loading() {
  return (
    <main className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
            <div className="h-6 w-10 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 h-40 animate-pulse" />

      {/* Trip rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="h-4 w-12 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
