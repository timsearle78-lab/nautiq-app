interface NautiqLogoProps {
  size?: number;
  /** dark = on a navy surface: white wordmark, amber IQ + anchor ring */
  dark?: boolean;
  className?: string;
}

export default function NautiqLogo({ size = 20, dark = false, className = "" }: NautiqLogoProps) {
  // On navy: anchor stroke white, ring dot solid amber
  // On light: anchor stroke navy, ring dot amber (D9A300 per spec)
  const anchorColor  = dark ? "#FFFFFF" : "#0B2942";
  const ringDotColor = "#FFC730"; // amber on both surfaces
  const wordColor    = dark ? "#FFFFFF" : "#0B2942";
  const iqColor      = dark ? "#FFC730" : "#0B2942"; // amber IQ on navy only; navy on light per spec

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Anchor mark with solid amber ring dot */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        {/* Solid amber ring dot at top */}
        <circle cx="50" cy="18" r="9" fill={ringDotColor} />
        {/* Anchor body */}
        <line x1="50" y1="27" x2="50" y2="84" stroke={anchorColor} strokeWidth="7" strokeLinecap="round" />
        <line x1="26" y1="43" x2="74" y2="43" stroke={anchorColor} strokeWidth="7" strokeLinecap="round" />
        <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56" stroke={anchorColor} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontSize: size * 0.9,
          lineHeight: 1,
        }}
      >
        <span style={{ color: wordColor }}>Naut</span>
        <span style={{ color: iqColor }}>IQ</span>
      </span>
    </span>
  );
}
