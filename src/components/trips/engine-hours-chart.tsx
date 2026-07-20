"use client";

const BAR_MAX_PX = 120;

type MonthBar = { label: string; hours: number; isCurrent: boolean };

export function EngineHoursChart({ bars }: { bars: MonthBar[] }) {
  const max = Math.max(...bars.map((b) => b.hours), 0.1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 pt-4 pb-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Engine hours by month
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5" style={{ height: `${BAR_MAX_PX}px` }}>
        {bars.map((bar) => {
          const barPx = bar.hours === 0 ? 4 : Math.max(6, Math.round((bar.hours / max) * BAR_MAX_PX));
          return (
            <div key={bar.label} className="flex-1 flex items-end group relative h-full">
              {/* Hover label */}
              {bar.hours > 0 && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] font-medium text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {bar.hours % 1 === 0 ? bar.hours : bar.hours.toFixed(1)}h
                </span>
              )}
              <div
                className={`w-full rounded-t-md transition-colors ${
                  bar.isCurrent
                    ? "bg-ocean-500"
                    : bar.hours === 0
                    ? "bg-slate-100"
                    : "bg-ocean-200 group-hover:bg-ocean-500"
                }`}
                style={{ height: `${barPx}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1.5 mt-2">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className={`flex-1 text-center text-[9px] ${
              bar.isCurrent ? "font-bold text-ocean-600" : "text-slate-400"
            }`}
          >
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
}
