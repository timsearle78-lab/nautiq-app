export default function NautiqAnchorIcon({ size, color = "currentColor" }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
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
  );
}
