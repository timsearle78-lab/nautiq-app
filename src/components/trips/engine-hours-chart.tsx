"use client";

type MonthBar = { label: string; hours: number; isCurrent: boolean };

export function EngineHoursChart({ bars }: { bars: MonthBar[] }) {
  const max = Math.max(...bars.map((b) => b.hours), 0.1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Engine hours by month
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {bars.map((bar) => {
            const heightPct = bar.hours === 0 ? 0 : Math.max(4, (bar.hours / max) * 100);
            return (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Tooltip on hover */}
                <div className="relative flex flex-col items-center w-full">
                  {bar.hours > 0 && (
                    <span className="absolute -top-5 text-[9px] font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {bar.hours % 1 === 0 ? bar.hours : bar.hours.toFixed(1)}h
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      bar.isCurrent
                        ? "bg-ocean-500"
                        : bar.hours === 0
                        ? "bg-slate-100"
                        : "bg-ocean-200 group-hover:bg-ocean-300"
                    }`}
                    style={{ height: bar.hours === 0 ? "4px" : `${heightPct}%`, maxHeight: "128px" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-1.5 mt-1.5">
          {bars.map((bar) => (
            <div
              key={bar.label}
              className={`flex-1 text-center text-[9px] truncate ${
                bar.isCurrent ? "font-semibold text-ocean-600" : "text-slate-400"
              }`}
            >
              {bar.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
