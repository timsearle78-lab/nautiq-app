export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat message area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Greeting card placeholder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 animate-pulse">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-200" />
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 animate-pulse">
              <div className="h-3 w-14 rounded bg-slate-200" />
              <div className="h-5 w-8 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Input bar placeholder */}
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="h-12 w-full rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
