"use client";

interface HealthGaugeProps {
  score: number;
  overdueCount: number;
  size?: number;
  strokeWidth?: number;
}

function gaugeColor(score: number, overdueCount: number) {
  if (overdueCount > 0 || score < 60) return { stroke: "#E0342A", text: "#E0342A", label: "Needs attention" };
  if (score < 80) return { stroke: "#FFC730", text: "#F0B012", label: "Could be better" };
  return { stroke: "#0E7A3D", text: "#0E7A3D", label: "Ship shape" };
}

export function HealthGauge({ score, overdueCount, size = 140, strokeWidth = 11 }: HealthGaugeProps) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // 270° arc (gap at bottom)
  const arcLength = circumference * 0.75;
  const gap = circumference - arcLength;
  const progress = Math.max(0, Math.min(1, score / 100)) * arcLength;

  const { stroke, text, label } = gaugeColor(score, overdueCount);

  return (
    <div className="flex flex-col items-center">
      {/* Navy circle behind the gauge */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "#0B2942" }}
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
