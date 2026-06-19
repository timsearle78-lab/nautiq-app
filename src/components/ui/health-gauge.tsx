"use client";

interface HealthGaugeProps {
  score: number;
  overdueCount: number;
  size?: number;
  strokeWidth?: number;
}

function gaugeColor(score: number, overdueCount: number) {
  if (overdueCount > 0 || score < 50) return { stroke: "#dc2626", text: "#dc2626", label: "Needs attention" };
  if (score < 75) return { stroke: "#d97706", text: "#d97706", label: "Moderate wear" };
  return { stroke: "#16a34a", text: "#16a34a", label: "Good condition" };
}

export function HealthGauge({ score, overdueCount, size = 140, strokeWidth = 10 }: HealthGaugeProps) {
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
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Progress */}
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
        {/* Score */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={text}
        >
          {score}
        </text>
        <text
          x={cx} y={cy + size * 0.16}
          textAnchor="middle"
          fontSize={size * 0.085}
          fill="#94a3b8"
        >
          out of 100
        </text>
      </svg>
      <span className="text-xs font-medium" style={{ color: text }}>{label}</span>
    </div>
  );
}
