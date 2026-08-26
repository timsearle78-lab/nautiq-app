"use client";

import { useState, useTransition } from "react";
import { updateGreetingPreference } from "@/app/(app)/settings/actions";

interface Props {
  initialHidden: boolean;
}

export function GreetingToggle({ initialHidden }: Props) {
  const [hidden, setHidden] = useState(initialHidden);
  const [isPending, startTransition] = useTransition();

  function toggle(hide: boolean) {
    setHidden(hide);
    startTransition(async () => {
      await updateGreetingPreference(hide);
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-700">Personal Boat Assistant</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {hidden ? "Greeting card is hidden on the Home page" : "Greeting card is shown on the Home page"}
        </p>
      </div>
      <div className={`flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <button
          onClick={() => toggle(false)}
          disabled={isPending}
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
          disabled={isPending}
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
