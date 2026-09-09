"use client";

const BAR_MAX_PX = 100;

type MonthBar = { label: string; maintenance: number; parts: number; isCurrent: boolean };

function fmt(n: number) {
  return n.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
}

export function SpendByMonthChart({ bars }: { bars: MonthBar[] }) {
  const max = Math.max(...bars.map((b) => b.maintenance + b.parts), 0.1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-3 pt-4 pb-3 flex flex-col">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
        By month
      </div>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="inline-block w-2 h-2 rounded-sm bg-ocean-500" />
          Maint.
        </span>
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400" />
          Parts
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1 flex-1" style={{ height: `${BAR_MAX_PX}px` }}>
        {bars.map((bar) => {
          const total = bar.maintenance + bar.parts;
          const totalPx = total === 0 ? 3 : Math.max(5, Math.round((total / max) * BAR_MAX_PX));
          const maintRatio = total > 0 ? bar.maintenance / total : 0;
          const maintPx = Math.round(totalPx * maintRatio);
          const partsPx = totalPx - maintPx;
          const isEmpty = total === 0;

          return (
            <div key={bar.label} className="flex-1 flex items-end group relative h-full">
              {!isEmpty && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-medium text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-white border border-slate-200 rounded px-1 py-0.5 shadow-sm">
                  {fmt(total)}
                </span>
              )}
              <div className="w-full flex flex-col rounded-t overflow-hidden" style={{ height: `${totalPx}px` }}>
                {partsPx > 0 && (
                  <div className={`w-full transition-colors ${bar.isCurrent ? "bg-emerald-400" : "bg-emerald-200 group-hover:bg-emerald-400"}`} style={{ height: `${partsPx}px` }} />
                )}
                {maintPx > 0 && (
                  <div className={`w-full transition-colors ${bar.isCurrent ? "bg-ocean-500" : "bg-ocean-200 group-hover:bg-ocean-500"}`} style={{ height: `${maintPx}px` }} />
                )}
                {isEmpty && <div className="w-full bg-slate-100" style={{ height: "3px" }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 mt-1.5">
        {bars.map((bar) => (
          <div key={bar.label} className={`flex-1 text-center text-[8px] ${bar.isCurrent ? "font-bold text-ocean-600" : "text-slate-400"}`}>
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
}
