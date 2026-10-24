"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function TestInactiveEmailButton() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/test-inactive-email", { method: "POST" });
      const data = await res.json();
      setStatus(data.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  const label = {
    idle: "Send test reminder email",
    sending: "Sending…",
    sent: "Sent to admins ✓",
    error: "Failed — check logs",
  }[status];

  return (
    <button
      onClick={handleClick}
      disabled={status === "sending"}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
    >
      <Mail size={14} className="shrink-0" />
      {label}
    </button>
  );
}
