"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { LATEST_RELEASE, SEEN_KEY } from "@/lib/changelog";

export default function WhatsNewCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== LATEST_RELEASE.date) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, LATEST_RELEASE.date);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-ocean-200 bg-gradient-to-br from-ocean-50 to-blue-50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
          >
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{"What's new"} — {LATEST_RELEASE.label}</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-white/60 transition"
        >
          <X size={15} />
        </button>
      </div>

      <ul className="px-4 pb-4 mt-1 space-y-1.5">
        {LATEST_RELEASE.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "#0B7EB8" }}
            />
            {f}
          </li>
        ))}
      </ul>

      <div className="border-t border-ocean-100 px-4 py-2.5">
        <button
          onClick={dismiss}
          className="text-xs font-semibold text-ocean-600 hover:text-ocean-700"
        >
          Got it — dismiss
        </button>
      </div>
    </div>
  );
}
