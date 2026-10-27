"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  daysLeft: number;
  plan: string;
};

export function TrialBanner({ daysLeft, plan }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || plan !== "trialing") return null;

  const urgent = daysLeft <= 7;
  const label =
    daysLeft <= 0
      ? "Your trial ends today"
      : daysLeft === 1
      ? "1 day left in your trial"
      : `${daysLeft} days left in your trial`;

  return (
    <div
      className={`mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
        urgent
          ? "bg-amber-500 text-white"
          : "bg-ocean-600 text-white"
      }`}
    >
      <span>
        {label} —{" "}
        <Link href="/subscribe" className="underline underline-offset-2 font-semibold">
          Subscribe now
        </Link>
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 opacity-80 hover:opacity-100 transition text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
