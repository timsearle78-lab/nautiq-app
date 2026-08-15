export default function Loading() {
  return (
    <main className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="h-7 w-40 rounded-lg bg-slate-200 animate-pulse" />

      {/* Health score bar */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-12 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Component rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-200 animate-pulse ml-4" />
          </div>
        ))}
      </div>
    </main>
  );
}
