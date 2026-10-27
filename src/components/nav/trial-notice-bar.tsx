"use client";

import Link from "next/link";

type Props = {
  plan: string;
  trialEndsAt: string | null;
};

export function TrialNoticeBar({ plan, trialEndsAt }: Props) {
  if (plan !== "trialing") return null;

  const daysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;

  const urgent = daysLeft !== null && daysLeft <= 7;

  const label =
    daysLeft === null ? "You're on a free trial" :
    daysLeft <= 0 ? "Your trial ends today" :
    daysLeft === 1 ? "1 day left in your free trial" :
    `${daysLeft} days left in your free trial`;

  return (
    <div
      className="w-full px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium"
      style={{
        background: urgent ? "#F59E0B" : "var(--color-ocean-600)",
        color: urgent ? "#1C0A00" : "#FFFFFF",
      }}
    >
      <span>{label}</span>
      <Link
        href="/subscribe"
        className="shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition"
        style={{
          background: urgent ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
          color: urgent ? "#1C0A00" : "#FFFFFF",
        }}
      >
        Subscribe now →
      </Link>
    </div>
  );
}
