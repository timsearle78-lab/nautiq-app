"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [step, setStep] = useState<"code" | "password">("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleVerifyCode(e: React.FormEvent) {
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
        type: "email",
      });
      if (otpError) throw otpError;
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 px-4 py-3" style={{ borderRadius: 11, border: "1px solid #B8E2C8", background: "#E7F6EE", color: "var(--color-status-healthy-fg)", fontSize: 13 }}>
        Password updated — taking you to the app…
      </div>
    );
  }

  if (step === "password") {
    return (
      <form onSubmit={handleSetPassword} className="mt-7 space-y-4">
        <div
          className="px-4 py-3"
          style={{ borderRadius: 11, border: "1px solid #B8E2C8", background: "#E7F6EE", color: "var(--color-status-healthy-fg)", fontSize: 13 }}
        >
          Code verified ✓
        </div>

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
            style={inputStyle}
            placeholder="At least 8 characters"
            autoFocus
            required
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy-700)" }}>
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle}
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
          {loading ? "Updating…" : "Set new password"}
        </button>

        {error && (
          <div className="px-4 py-3" style={{ borderRadius: 11, border: "1px solid #F3C4C4", background: "#FDEBEB", color: "var(--color-status-critical-fg)", fontSize: 13 }}>
            {error}
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="mt-7 space-y-4">
      <div>
        <label htmlFor="code" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy-700)" }}>
          6-digit code
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
        {loading ? "Verifying…" : "Verify code"}
      </button>

      {error && (
        <div className="px-4 py-3" style={{ borderRadius: 11, border: "1px solid #F3C4C4", background: "#FDEBEB", color: "var(--color-status-critical-fg)", fontSize: 13 }}>
          {error}
        </div>
      )}
    </form>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "#EEF1F5" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <NautiqLogo size={20} />
        <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--color-navy-700)" }}>Set new password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the code we emailed you to continue.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Loading…</p>}>
          <UpdatePasswordForm />
        </Suspense>
        <p className="mt-6 text-sm text-slate-500">
          Didn't get a code?{" "}
          <Link href="/forgot-password" className="font-medium" style={{ color: "var(--color-ocean-600)" }}>
            Try again
          </Link>
        </p>
      </div>
    </div>
  );
}
