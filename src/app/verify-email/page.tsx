"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NautiqLogo from "@/components/ui/nautiq-logo";

const inputStyle = {
  borderRadius: 11,
  border: "1.5px solid #E0E6EC",
  background: "#FFFFFF",
  padding: "13px 15px",
  fontSize: 14.5,
  color: "var(--color-navy-700)",
  width: "100%",
  outline: "none",
} as React.CSSProperties;

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (otpError) throw otpError;

      // Sign the user out immediately — they verified but shouldn't be auto-logged in.
      // The server sets a one-time cookie so the login page shows the confirmed banner.
      await supabase.auth.signOut();
      await fetch("/api/auth/set-confirmed-cookie", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code. Try requesting a new one.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResent(false);
    setError(null);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) throw resendError;
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="mt-7 space-y-4">
      <div>
        <label
          htmlFor="code"
          className="mb-2 block"
          style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy-700)" }}
        >
          Verification code
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{ ...inputStyle, letterSpacing: "0.25em", fontSize: 20, textAlign: "center" }}
          placeholder="······"
          autoFocus
          required
        />
        {email && (
          <p className="mt-1.5 text-xs text-slate-400">Sent to {email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-xl btn-primary px-6 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify email"}
      </button>

      {error && (
        <div
          className="px-4 py-3"
          style={{ borderRadius: 11, border: "1px solid #F3C4C4", background: "#FDEBEB", color: "var(--color-status-critical-fg)", fontSize: 13 }}
        >
          {error}
        </div>
      )}

      {resent && (
        <div
          className="px-4 py-3"
          style={{ borderRadius: 11, border: "1px solid #B8E2C8", background: "#E7F6EE", color: "var(--color-status-healthy-fg)", fontSize: 13 }}
        >
          New code sent — check your inbox.
        </div>
      )}

      <p className="text-sm text-slate-500">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium hover:underline disabled:opacity-50"
          style={{ color: "var(--color-ocean-600)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "#EEF1F5" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <NautiqLogo size={20} />
        <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--color-navy-700)" }}>
          Check your email
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit code to confirm your email address. Enter it below to activate your account.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Loading…</p>}>
          <VerifyEmailForm />
        </Suspense>
        <p className="mt-6 text-sm text-slate-500">
          Wrong email?{" "}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: "var(--color-ocean-600)" }}>
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
