"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      router.push(`/update-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "#EEF1F5" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <NautiqLogo size={20} />
        <h2 className="mt-6 text-xl font-semibold" style={{ color: "var(--color-navy-700)" }}>Reset password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we'll send you a 6-digit code.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy-700)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl btn-primary px-6 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>

        {error && (
          <div
            className="mt-4 px-4 py-3"
            style={{ borderRadius: 11, border: "1px solid #F3C4C4", background: "#FDEBEB", color: "var(--color-status-critical-fg)", fontSize: 13 }}
          >
            {error}
          </div>
        )}

        <p className="mt-6 text-sm text-slate-500">
          Remember your password?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--color-ocean-600)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
