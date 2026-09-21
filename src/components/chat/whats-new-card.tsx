"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { LATEST_RELEASE, SEEN_KEY } from "@/lib/changelog";

export default function WhatsNewCard({ hidden }: { hidden: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hidden) return;
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== LATEST_RELEASE.date) {
      setVisible(true);
    }
  }, [hidden]);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, LATEST_RELEASE.date);
    setVisible(false);
  }

  if (hidden || !visible) return null;

  return (
    <div
      className="mx-4 mt-4 rounded-[18px] overflow-hidden"
      style={{ background: "#FFFFFF", border: "1.5px solid #DBE3EA" }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0"
            style={{ background: "var(--color-amber-400)" }}
          >
            <Sparkles size={13} color="var(--color-amber-ink)" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-navy-700)" }}>
            {"What's new"} — {LATEST_RELEASE.label}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{ color: "var(--color-navy-mute)" }}
        >
          <X size={15} />
        </button>
      </div>

      <ul className="px-4 pb-4 mt-1 space-y-2">
        {LATEST_RELEASE.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2" style={{ fontSize: 14, color: "var(--color-navy-700)", lineHeight: 1.5 }}>
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "var(--color-amber-400)" }}
            />
            {f}
          </li>
        ))}
      </ul>

      <div className="px-4 py-2.5" style={{ borderTop: "1.5px solid #DBE3EA" }}>
        <button
          onClick={dismiss}
          style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ocean-600)" }}
          className="hover:opacity-80 transition-opacity"
        >
          Got it — dismiss
        </button>
      </div>
    </div>
  );
}
