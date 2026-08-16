"use client";

export type CategorySlice = { name: string; amount: number };

const COLORS = [
  "#0E8FC9", // ocean
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EF4444", // red
  "#06B6D4", // cyan
  "#F97316", // orange
  "#84CC16", // lime
];

function fmt(n: number) {
  return n.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function SpendByCategoryChart({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, c) => s + c.amount, 0);
  if (total === 0) return null;

  // Sort descending, cap at 6 slices with an "Other" rollup
  const sorted = [...slices].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  const displayed: CategorySlice[] = rest.length > 0
    ? [...top, { name: "Other", amount: rest.reduce((s, c) => s + c.amount, 0) }]
    : top;

  const cx = 56; const cy = 56; const r = 50;
  let cursor = 0;
  const paths = displayed.map((slice, i) => {
    const deg = (slice.amount / total) * 360;
    const start = cursor;
    const end = cursor + deg;
    cursor = end;
    return { ...slice, start, end, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-3 pt-4 pb-3 flex flex-col">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
        By category
      </div>

      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 112 112" className="w-28 h-28 flex-shrink-0">
          {paths.map((p, i) => (
            <path
              key={i}
              d={slicePath(cx, cy, r, p.start, p.end)}
              fill={p.color}
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
          {/* Centre hole */}
          <circle cx={cx} cy={cy} r={28} fill="white" />
          {/* Centre label */}
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F2335">{fmt(total)}</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#8593A0">total</text>
        </svg>

        {/* Legend */}
        <div className="w-full space-y-1.5">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
              <span className="text-[10px] text-slate-600 truncate flex-1 min-w-0">{p.name}</span>
              <span className="text-[10px] font-medium text-slate-800 flex-shrink-0">{fmt(p.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
