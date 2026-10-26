"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KeyRound } from "lucide-react";

export function ResetPasswordButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (!error) {
      window.location.href = `/update-password?email=${encodeURIComponent(email)}`;
    } else {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-green-600 font-medium">
        Code sent — check your inbox.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleReset}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-ocean-600 transition-colors disabled:opacity-50"
      >
        <KeyRound size={16} className="text-slate-400" />
        {loading ? "Sending…" : "Reset password"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-500">Failed to send reset email. Please try again.</p>
      )}
    </div>
  );
}
