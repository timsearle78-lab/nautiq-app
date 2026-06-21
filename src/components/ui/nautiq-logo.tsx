interface NautiqLogoProps {
  size?: number;
  dark?: boolean;
  className?: string;
}

export default function NautiqLogo({ size = 20, dark = false, className = "" }: NautiqLogoProps) {
  const anchorColor = dark ? "#5EC6EE" : "#0B7EB8";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke={anchorColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="50" cy="18" r="9" />
        <line x1="50" y1="27" x2="50" y2="84" />
        <line x1="26" y1="43" x2="74" y2="43" />
        <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56" />
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
        <span style={{ color: dark ? "#FFFFFF" : "#0B2942" }}>Naut</span>
        <span style={{ color: dark ? "#5EC6EE" : "#0B7EB8" }}>IQ</span>
      </span>
    </span>
  );
}
