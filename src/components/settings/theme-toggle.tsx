"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-700">Appearance</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {theme === "dark" ? "Dark mode — optimised for low light" : "Light mode — standard display"}
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50">
        <button
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            theme === "light"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sun size={13} />
          Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            theme === "dark"
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Moon size={13} />
          Dark
        </button>
      </div>
    </div>
  );
}
