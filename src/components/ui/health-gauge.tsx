"use client";

interface HealthGaugeProps {
  score: number;
  overdueCount: number;
  size?: number;
  strokeWidth?: number;
  fuelPct?: number | null;
}

function gaugeColor(score: number, overdueCount: number) {
  if (overdueCount > 0 || score < 60) return { stroke: "var(--color-status-critical-fg)", text: "var(--color-status-critical-fg)", label: "Needs attention" };
  if (score < 80) return { stroke: "var(--color-amber-400)", text: "#F0B012", label: "Could be better" };
  return { stroke: "var(--color-status-healthy-fg)", text: "var(--color-status-healthy-fg)", label: "Ship shape" };
}

export function HealthGauge({ score, overdueCount, size = 140, strokeWidth = 11, fuelPct }: HealthGaugeProps) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // 270° arc (gap at bottom)
  const arcLength = circumference * 0.75;
  const gap = circumference - arcLength;
  const progress = Math.max(0, Math.min(1, score / 100)) * arcLength;

  const { stroke, text, label } = gaugeColor(score, overdueCount);

  // Fuel ring — thin outer arc, same 270° sweep
  const fuelStrokeWidth = Math.max(3, strokeWidth * 0.4);
  const fuelGap = 3;
  const fuelR = r + strokeWidth / 2 + fuelGap + fuelStrokeWidth / 2;
  const fuelCircumference = 2 * Math.PI * fuelR;
  const fuelArcLength = fuelCircumference * 0.75;
  const fuelProgress = fuelPct != null ? Math.max(0, Math.min(1, fuelPct)) * fuelArcLength : 0;
  const fuelColor =
    fuelPct == null ? null :
    fuelPct < 0.2 ? "#E53E3E" :
    fuelPct < 0.4 ? "#D97706" :
    "#0B7EB8";

  return (
    <div className="flex flex-col items-center">
      {/* Navy circle behind the gauge */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "var(--color-navy-700)" }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ overflow: "visible" }}
        >
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${gap}`}
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
          />
          {/* Progress arc — amber/red/green */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
          {/* Fuel ring track */}
          {fuelPct != null && (
            <circle
              cx={cx} cy={cy} r={fuelR}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={fuelStrokeWidth}
              strokeDasharray={`${fuelArcLength} ${fuelCircumference - fuelArcLength}`}
              strokeLinecap="round"
              transform={`rotate(135 ${cx} ${cy})`}
            />
          )}
          {/* Fuel ring fill */}
          {fuelPct != null && fuelProgress > 0 && (
            <circle
              cx={cx} cy={cy} r={fuelR}
              fill="none"
              stroke={fuelColor!}
              strokeWidth={fuelStrokeWidth}
              strokeDasharray={`${fuelProgress} ${fuelCircumference - fuelProgress}`}
              strokeLinecap="round"
              transform={`rotate(135 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          )}
          {/* E / F labels at arc endpoints */}
          {fuelPct != null && (() => {
            const labelR = fuelR + fuelStrokeWidth / 2 + 5;
            const d = labelR * Math.SQRT1_2; // cos/sin of 45°
            const fontSize = Math.max(10, size * 0.085);
            return (
              <>
                <text x={cx - d} y={cy + d} textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize} fontWeight="700" fill="rgba(255,255,255,0.45)"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>E</text>
                <text x={cx + d} y={cy + d} textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize} fontWeight="700" fill="rgba(255,255,255,0.45)"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>F</text>
              </>
            );
          })()}
        </svg>
        {/* Center text */}
        <div className="relative flex flex-col items-center leading-none">
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: size * 0.26,
              color: "#FFFFFF",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: size * 0.085,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            OF 100
          </span>
        </div>
      </div>
      <span
        className="mt-2 text-xs font-bold uppercase tracking-wide"
        style={{ color: text, letterSpacing: "0.06em" }}
      >
        {label}
      </span>
    </div>
  );
}
