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
  const arcLength = circumference * 0.75;
  const gap = circumference - arcLength;
  const progress = Math.max(0, Math.min(1, score / 100)) * arcLength;

  const { stroke, text, label } = gaugeColor(score, overdueCount);

  const fuelStrokeWidth = strokeWidth;
  const fuelGap = 5;
  const fuelR = r + strokeWidth / 2 + fuelGap + fuelStrokeWidth / 2;
  const fuelCircumference = 2 * Math.PI * fuelR;
  const fuelArcLength = fuelCircumference * 0.75;
  const fuelProgress = fuelPct != null ? Math.max(0, Math.min(1, fuelPct)) * fuelArcLength : 0;
  const fuelColor =
    fuelPct == null ? null :
    fuelPct < 0.2 ? "#E53E3E" :
    fuelPct < 0.4 ? "#D97706" :
    "#0B7EB8";

  // E/F labels sit just outside the fuel ring. We back them with a small navy
  // circle so they're readable even outside the main navy background area.
  const labelFontSize = Math.max(10, size * 0.1);
  const labelR = fuelR + fuelStrokeWidth / 2 + labelFontSize * 0.6;
  const ld = labelR * Math.SQRT1_2; // 45° diagonal — arc endpoints
  const labelBgR = labelFontSize * 0.78;

  // Score text vertical layout
  const scoreFontSize = size * 0.26;
  const subFontSize = size * 0.085;
  const scoreY = cy - subFontSize * 0.6;
  const subY = cy + scoreFontSize * 0.52;

  return (
    <div className="flex flex-col items-center">
      {/*
        Pure SVG gauge — navy background is an SVG <circle>, not a CSS rounded div.
        This avoids mobile Chrome clipping SVG overflow on border-radius elements.
      */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        {/* Navy background circle */}
        <circle cx={cx} cy={cy} r={size / 2} fill="var(--color-navy-700)" />

        {/* Health arc track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${gap}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`} />

        {/* Health arc progress */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }} />

        {/* Fuel ring track */}
        {fuelPct != null && (
          <circle cx={cx} cy={cy} r={fuelR} fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth={fuelStrokeWidth}
            strokeDasharray={`${fuelArcLength} ${fuelCircumference - fuelArcLength}`} strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`} />
        )}

        {/* Fuel ring fill */}
        {fuelPct != null && fuelProgress > 0 && (
          <circle cx={cx} cy={cy} r={fuelR} fill="none"
            stroke={fuelColor!} strokeWidth={fuelStrokeWidth}
            strokeDasharray={`${fuelProgress} ${fuelCircumference - fuelProgress}`} strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
        )}

        {/* E / F labels — backed by small navy circles so they read on any background */}
        {fuelPct != null && (
          <>
            <circle cx={cx - ld} cy={cy + ld} r={labelBgR} fill="var(--color-navy-700)" />
            <text x={cx - ld} y={cy + ld} textAnchor="middle" dominantBaseline="middle"
              fontSize={labelFontSize} fontWeight="700" fill="rgba(255,255,255,0.7)"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>E</text>
            <circle cx={cx + ld} cy={cy + ld} r={labelBgR} fill="var(--color-navy-700)" />
            <text x={cx + ld} y={cy + ld} textAnchor="middle" dominantBaseline="middle"
              fontSize={labelFontSize} fontWeight="700" fill="rgba(255,255,255,0.7)"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>F</text>
          </>
        )}

        {/* Score */}
        <text x={cx} y={scoreY} textAnchor="middle" dominantBaseline="auto"
          fontSize={scoreFontSize} fontWeight="800" fill="#FFFFFF"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}>
          {score}
        </text>
        <text x={cx} y={subY} textAnchor="middle" dominantBaseline="hanging"
          fontSize={subFontSize} fontWeight="600" fill="rgba(255,255,255,0.45)"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          OF 100
        </text>
      </svg>

      <span className="mt-2 text-xs font-bold uppercase tracking-wide"
        style={{ color: text, letterSpacing: "0.06em" }}>
        {label}
      </span>
    </div>
  );
}
