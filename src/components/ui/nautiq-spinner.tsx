import NautiqAnchorIcon from "@/components/ui/nautiq-anchor-icon";

export default function NautiqSpinner({
  size = 48,
  overlay = false,
}: {
  size?: number;
  overlay?: boolean;
}) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="rounded-full flex items-center justify-center animate-spin"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #15A0D6, #0B7EB8)",
          boxShadow: "0 4px 16px rgba(11,126,184,.30)",
          animationDuration: "1s",
        }}
      >
        <NautiqAnchorIcon size={Math.round(size * 0.5)} color="#fff" />
      </div>
    </div>
  );

  if (!overlay) return spinner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      {spinner}
    </div>
  );
}
