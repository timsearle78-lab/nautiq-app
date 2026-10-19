"use client";

interface UploadProgressBarProps {
  pct: number | null;
}

export function UploadProgressBar({ pct }: UploadProgressBarProps) {
  if (pct === null) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-ocean-500 transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 text-right">{pct}%</p>
    </div>
  );
}
