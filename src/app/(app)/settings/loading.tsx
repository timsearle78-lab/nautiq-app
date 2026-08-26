export default function Loading() {
  return (
    <main className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-7 w-24 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-4 w-56 rounded bg-slate-200 animate-pulse" />
      </div>

      {/* Boat card skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Systems skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance + Notifications skeletons */}
      {[1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="px-4 py-4 h-24 animate-pulse" />
        </div>
      ))}
    </main>
  );
}
