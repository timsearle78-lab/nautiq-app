"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NautiqLogo from "@/components/ui/nautiq-logo";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Check if there's already an active session (e.g. came via /auth/confirm cookie flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    // Also listen for PASSWORD_RECOVERY event (hash-fragment implicit flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("Password updated successfully. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "#EEF1F5" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <NautiqLogo size={20} />
        <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--color-navy-700)" }}>Set new password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your new password below.
        </p>

        {!ready ? (
          <p className="mt-8 text-sm text-slate-500">Verifying your reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="password" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy-700)" }}>
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderRadius: 11, border: "1.5px solid #E0E6EC", background: "#FFFFFF", padding: "13px 15px", fontSize: 14.5, color: "var(--color-navy-700)", width: "100%", outline: "none" }}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy-700)" }}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ borderRadius: 11, border: "1.5px solid #E0E6EC", background: "#FFFFFF", padding: "13px 15px", fontSize: 14.5, color: "var(--color-navy-700)", width: "100%", outline: "none" }}
                placeholder="Repeat your password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl btn-primary px-6 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        {(status || error) && (
          <div
            className="mt-4 px-4 py-3"
            style={{
              borderRadius: 11,
              border: `1px solid ${error ? "#F3C4C4" : "#B8E2C8"}`,
              background: error ? "#FDEBEB" : "#E7F6EE",
              color: error ? "var(--color-status-critical-fg)" : "var(--color-status-healthy-fg)",
              fontSize: 13,
            }}
          >
            {error ?? status}
          </div>
        )}

        {status && (
          <p className="mt-6 text-sm text-slate-500">
            <Link href="/login" className="font-medium" style={{ color: "var(--color-ocean-600)" }}>
              Go to sign in →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
