export default function Loading() {
  return (
    <main className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-7 w-36 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
      </div>

      {/* Score card */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 w-14 rounded-xl bg-slate-200 animate-pulse" />
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
      </div>

      {/* Issue rows */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="h-3 w-56 rounded bg-slate-200 animate-pulse ml-7" />
        </div>
      ))}
    </main>
  );
}
