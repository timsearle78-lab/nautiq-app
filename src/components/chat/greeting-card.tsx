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
              <div
                className="flex items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                style={{
                  width: 24,
                  height: 24,
                  background: "linear-gradient(135deg,#15A0D6,#0B7EB8)",
                }}
              >
                ⚓
              </div>
              <span className="text-xs font-semibold text-ocean-700">Your PBA</span>
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
