"use client";

import { useState } from "react";

interface ImpersonationBannerProps {
  adminEmail?: string;
  targetEmail?: string;
  targetId?: string;
}

export function ImpersonationBanner({ adminEmail, targetEmail, targetId }: ImpersonationBannerProps) {
  const [exiting, setExiting] = useState(false);

  if (!targetEmail || !adminEmail) return null;

  async function handleExit() {
    setExiting(true);
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-400 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span className="truncate">
          Admin view: logged in as <strong>{targetEmail}</strong>
          <span className="hidden sm:inline text-amber-800 font-normal"> (your account: {adminEmail})</span>
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="shrink-0 bg-amber-950 text-amber-50 rounded-lg px-3 py-1 text-xs font-semibold hover:bg-amber-900 transition disabled:opacity-60"
      >
        {exiting ? "Exiting…" : "Exit impersonation"}
      </button>
    </div>
  );
}
