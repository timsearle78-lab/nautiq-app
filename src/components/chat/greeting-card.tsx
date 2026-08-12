"use client";

import { useEffect, useState } from "react";

interface GreetingCardProps {
  boatId: string;
}

export default function GreetingCard({ boatId }: GreetingCardProps) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const localHour = new Date().getHours();
    fetch("/api/chat/greeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boatId, localHour }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.greeting) setGreeting(data.greeting);
      })
      .catch(() => {});
  }, [boatId]);

  if (dismissed) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl rounded-tl-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-1 pt-1">
        <div className="rounded-xl bg-ocean-50 border border-ocean-100 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 mb-2">
              <svg
                width={20}
                height={20}
                viewBox="0 0 100 100"
                fill="none"
                stroke="#0B7EB8"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <circle cx="50" cy="18" r="9" />
                <line x1="50" y1="27" x2="50" y2="84" />
                <line x1="26" y1="43" x2="74" y2="43" />
                <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56" />
              </svg>
              <span className="text-xs font-semibold text-ocean-700">NautIQ — Your Personal Boat Assistant</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors text-xs leading-none mt-0.5 shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          {greeting ? (
            <p className="text-sm text-slate-700 leading-relaxed">{greeting}</p>
          ) : (
            <div className="space-y-2">
              <div className="h-3.5 bg-ocean-100 rounded animate-pulse w-full" />
              <div className="h-3.5 bg-ocean-100 rounded animate-pulse w-4/5" />
              <div className="h-3.5 bg-ocean-100 rounded animate-pulse w-3/5" />
            </div>
          )}
        </div>
      </div>
      <div className="h-1" />
    </div>
  );
}
