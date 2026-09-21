"use client";

import { useState } from "react";

export function ImpersonateButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImpersonate() {
    if (!confirm(`Log in as ${userEmail}?\n\nYou will be signed in as this user. Use the "Exit impersonation" banner to return to your admin account.`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      // Redirect to the magic link — Supabase will sign us in as the target user
      window.location.href = data.actionLink;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleImpersonate}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-2 hover:bg-amber-100 transition disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        {loading ? "Generating link…" : "Log in as this user"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
