"use client";

type Props = {
  currentLitres: number | null;
  tankLitres: number | null;
  size?: number;
};

export function FuelGauge({ currentLitres, tankLitres, size = 120 }: Props) {
  const hasData = tankLitres != null && tankLitres > 0 && currentLitres != null;
  const pct = hasData ? Math.min(1, Math.max(0, currentLitres! / tankLitres!)) : null;

  // Arc geometry: 210° sweep starting from 195° (bottom-left), clockwise
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.09;
  const sweep = 210;
  const startAngle = 195;

  function polar(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(fromDeg: number, toDeg: number, radius: number) {
    const start = polar(fromDeg, radius);
    const end = polar(toDeg, radius);
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  const endAngle = startAngle + sweep;
  const fillAngle = pct != null ? startAngle + pct * sweep : startAngle;

  // Needle tip
  const needleAngle = pct != null ? fillAngle : startAngle;
  const needleTip = polar(needleAngle, r * 0.78);
  const needleBase = polar(needleAngle + 90, strokeW * 0.28);
  const needleBase2 = polar(needleAngle - 90, strokeW * 0.28);

  const fuelColor =
    pct == null ? "#94A3B8" :
    pct < 0.2 ? "#E53E3E" :
    pct < 0.4 ? "#D97706" :
    "#0B7EB8";

  const label =
    pct == null ? "—" :
    pct < 0.2 ? "Low" :
    pct < 0.4 ? "Reserve" :
    pct < 0.7 ? "Half" :
    "Full";

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.78}`} style={{ overflow: "visible" }}>
        {/* Track */}
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke="var(--color-border, #DBE3EA)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Fill */}
        {pct != null && pct > 0 && (
          <path
            d={arcPath(startAngle, fillAngle, r)}
            fill="none"
            stroke={fuelColor}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Needle dot */}
        {pct != null && (
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase.x},${needleBase.y} ${cx},${cy} ${needleBase2.x},${needleBase2.y}`}
            fill={fuelColor}
            opacity={0.85}
          />
        )}
        <circle cx={cx} cy={cy} r={strokeW * 0.45} fill={fuelColor} opacity={0.9} />

        {/* Centre text */}
        <text
          x={cx}
          y={cy + r * 0.12}
          textAnchor="middle"
          style={{ fontSize: size * 0.14, fontWeight: 800, fill: "var(--color-navy-700, #0B2942)", fontFamily: "inherit" }}
        >
          {pct != null ? `${Math.round(pct * 100)}%` : "—"}
        </text>
        <text
          x={cx}
          y={cy + r * 0.12 + size * 0.115}
          textAnchor="middle"
          style={{ fontSize: size * 0.095, fill: "var(--color-navy-mute, #6B849A)", fontFamily: "inherit" }}
        >
          {label}
        </text>

        {/* E / F labels */}
        {(() => {
          const ePos = polar(startAngle - 2, r * 1.28);
          const fPos = polar(endAngle + 2, r * 1.28);
          return (
            <>
              <text x={ePos.x} y={ePos.y + size * 0.035} textAnchor="middle" style={{ fontSize: size * 0.085, fill: "#E53E3E", fontWeight: 700, fontFamily: "inherit" }}>E</text>
              <text x={fPos.x} y={fPos.y + size * 0.035} textAnchor="middle" style={{ fontSize: size * 0.085, fill: "#0B7EB8", fontWeight: 700, fontFamily: "inherit" }}>F</text>
            </>
          );
        })()}
      </svg>

      <div style={{ fontSize: size * 0.09, color: "var(--color-navy-mute)", marginTop: 2, textAlign: "center" }}>
        {hasData
          ? `${Math.round(currentLitres!)} / ${Math.round(tankLitres!)} L`
          : tankLitres
            ? `Tank: ${Math.round(tankLitres)} L`
            : "Set tank size in Settings"}
      </div>
    </div>
  );
}
