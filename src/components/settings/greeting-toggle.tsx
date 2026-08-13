"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nautiq_hide_greeting";

export function GreetingToggle() {
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "true");
    setMounted(true);
  }, []);

  function toggle(hide: boolean) {
    setHidden(hide);
    localStorage.setItem(STORAGE_KEY, String(hide));
  }

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-700">Personal Boat Assistant</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {hidden ? "Greeting card is hidden on the Home page" : "Greeting card is shown on the Home page"}
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50">
        <button
          onClick={() => toggle(false)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            !hidden
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Show
        </button>
        <button
          onClick={() => toggle(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            hidden
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Hide
        </button>
      </div>
    </div>
  );
}
