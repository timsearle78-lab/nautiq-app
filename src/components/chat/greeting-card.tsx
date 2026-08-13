"use client";

import { useEffect, useState } from "react";

interface GreetingCardProps {
  boatId: string;
}

interface GreetingData {
  greeting: string;
  healthScore: number;
  overdueCount: number;
  dueSoonCount: number;
  engineHours: number;
  tripCount: number;
  daysSinceTrip: number | null;
}

const HIDE_KEY = "nautiq_hide_greeting";

export default function GreetingCard({ boatId }: GreetingCardProps) {
  const [data, setData] = useState<GreetingData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(HIDE_KEY) === "true") {
      setHidden(true);
      return;
    }
    const localHour = new Date().getHours();
    fetch("/api/chat/greeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boatId, localHour }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.greeting) setData(d);
      })
      .catch(() => {});
  }, [boatId]);

  if (hidden || dismissed) return null;

  const paragraphs = data?.greeting.split(/\n\n+/).filter(Boolean) ?? [];

  const healthColor =
    !data ? "text-slate-500" :
    data.healthScore >= 80 ? "text-green-600" :
    data.healthScore >= 60 ? "text-amber-600" :
    "text-red-600";

  return (
    <div className="mx-4 mt-4 rounded-2xl rounded-tl-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-1 pt-1">
        <div className="rounded-xl bg-ocean-50 border border-ocean-100 px-4 py-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
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

          {/* Stat chips */}
          {data ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                data.healthScore >= 80 ? "border-green-200 bg-green-50 text-green-700" :
                data.healthScore >= 60 ? "border-amber-200 bg-amber-50 text-amber-700" :
                "border-red-200 bg-red-50 text-red-700"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  data.healthScore >= 80 ? "bg-green-500" :
                  data.healthScore >= 60 ? "bg-amber-500" : "bg-red-500"
                }`} />
                Health {data.healthScore}/100
              </span>

              {data.overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {data.overdueCount} overdue
                </span>
              )}
              {data.overdueCount === 0 && data.dueSoonCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {data.dueSoonCount} due soon
                </span>
              )}

              {data.engineHours > 0 && (
                <span className="inline-flex items-center rounded-full border border-ocean-200 bg-ocean-50 px-2.5 py-0.5 text-xs font-medium text-ocean-700">
                  {data.engineHours}h engine
                </span>
              )}

              {data.tripCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {data.tripCount} trip{data.tripCount !== 1 ? "s" : ""} this month
                </span>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5 mb-3">
              <div className="h-5 w-24 bg-ocean-100 rounded-full animate-pulse" />
              <div className="h-5 w-20 bg-ocean-100 rounded-full animate-pulse" />
            </div>
          )}

          {/* Greeting text */}
          {paragraphs.length > 0 ? (
            <div className="space-y-2">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
              ))}
            </div>
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
