type BoatHealthGaugeProps = {
  score: number;
};

export default function BoatHealthGauge({ score }: BoatHealthGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 48;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset =
    circumference - (normalizedScore / 100) * circumference;

  const color =
    normalizedScore > 80
      ? "green"
      : normalizedScore > 60
      ? "orange"
      : "red";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 140,
      }}
    >
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e5e5"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.4s ease",
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#111"
        >
          {normalizedScore}
        </text>
      </svg>

      <div style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
        Boat Health
      </div>
    </div>
  );
}