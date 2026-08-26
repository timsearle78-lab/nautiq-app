"use client";

import { useEffect, useState } from "react";

interface GreetingCardProps {
  boatId: string;
  hidden: boolean;
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

export default function GreetingCard({ boatId, hidden }: GreetingCardProps) {
  const [data, setData] = useState<GreetingData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hidden) return;
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
  }, [boatId, hidden]);

  if (hidden || dismissed) return null;

  const paragraphs = data?.greeting.split(/\n\n+/).filter(Boolean) ?? [];

  const chipStyle = (color: "green" | "amber" | "red" | "neutral"): React.CSSProperties => {
    if (color === "green") return { background: "#E6F6EC", color: "#0E7A3D", border: "1.5px solid #0E7A3D22" };
    if (color === "amber") return { background: "#FFF6DF", color: "#D9A300", border: "1.5px solid #D9A30022" };
    if (color === "red") return { background: "#FDECEA", color: "#E0342A", border: "1.5px solid #E0342A22" };
    return { background: "#F4F7FA", color: "#8FB3CC", border: "1.5px solid #DBE3EA" };
  };

  const healthChipColor = data
    ? data.healthScore >= 80 ? "green" : data.healthScore >= 60 ? "amber" : "red"
    : "neutral";

  return (
    <div
      className="mx-4 rounded-[18px] overflow-hidden"
      style={{ background: "#FFFFFF", border: "1.5px solid #DBE3EA" }}
    >
      <div className="px-4 pt-4 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "#0B2942" }}
            >
              <svg width={14} height={14} viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <circle cx="50" cy="18" r="9" fill="#FFC730" />
                <line x1="50" y1="27" x2="50" y2="84" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
                <line x1="26" y1="43" x2="74" y2="43" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
                <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0B2942" }}>
              NautIQ — Your Personal Boat Assistant
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="transition-opacity hover:opacity-70 shrink-0"
            style={{ color: "#8FB3CC", fontSize: 15, lineHeight: 1 }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Stat chips */}
        {data ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5"
              style={{ fontSize: 12, fontWeight: 700, ...chipStyle(healthChipColor) }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
              Health {data.healthScore}/100
            </span>

            {data.overdueCount > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5" style={{ fontSize: 12, fontWeight: 700, ...chipStyle("red") }}>
                {data.overdueCount} overdue
              </span>
            )}
            {data.overdueCount === 0 && data.dueSoonCount > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5" style={{ fontSize: 12, fontWeight: 700, ...chipStyle("amber") }}>
                {data.dueSoonCount} due soon
              </span>
            )}

            {data.engineHours > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5" style={{ fontSize: 12, fontWeight: 600, ...chipStyle("neutral") }}>
                {data.engineHours}h engine
              </span>
            )}

            {data.tripCount > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5" style={{ fontSize: 12, fontWeight: 600, ...chipStyle("neutral") }}>
                {data.tripCount} trip{data.tripCount !== 1 ? "s" : ""} this month
              </span>
            )}
          </div>
        ) : (
          <div className="flex gap-1.5 mb-3">
            <div className="h-5 w-24 rounded-full animate-pulse" style={{ background: "#F4F7FA" }} />
            <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: "#F4F7FA" }} />
          </div>
        )}

        {/* Greeting text */}
        {paragraphs.length > 0 ? (
          <div className="space-y-2">
            {paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 14, color: "#0B2942", lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-3.5 rounded animate-pulse w-full" style={{ background: "#F4F7FA" }} />
            <div className="h-3.5 rounded animate-pulse w-4/5" style={{ background: "#F4F7FA" }} />
            <div className="h-3.5 rounded animate-pulse w-3/5" style={{ background: "#F4F7FA" }} />
          </div>
        )}

        {data && (
          <div className="mt-3" style={{ borderTop: "1.5px solid #DBE3EA", paddingTop: 10 }}>
            <a href="/health" style={{ fontSize: 13, fontWeight: 700, color: "#0B7EB8" }}>
              Read full update →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
