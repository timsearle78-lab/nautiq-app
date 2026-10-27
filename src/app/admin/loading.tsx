export default function AdminLoading() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1.5 animate-pulse">
          <div className="h-5 w-16 rounded bg-slate-200" />
          <div className="h-3.5 w-36 rounded bg-slate-200" />
        </div>
        <div className="h-8 w-28 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center animate-pulse">
            <div className="h-7 w-10 rounded bg-slate-200 mx-auto mb-1" />
            <div className="h-3 w-20 rounded bg-slate-200 mx-auto" />
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="h-3.5 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-12 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse">
              <div className="h-3.5 flex-1 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-200 hidden sm:block" />
              <div className="h-3 w-16 rounded bg-slate-200 hidden lg:block" />
              <div className="h-3 w-6 rounded bg-slate-200" />
              <div className="h-3 w-6 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
