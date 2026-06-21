"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NautiqLogo from "@/components/ui/nautiq-logo";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus("Signed in successfully.");
      window.location.href = "/chat";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const isError = status && status !== "Signed in successfully.";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#EEF1F5" }}
    >
      <div
        className="w-full max-w-4xl overflow-hidden grid md:grid-cols-2"
        style={{ borderRadius: 24, boxShadow: "0 12px 30px rgba(13,52,87,.16)" }}
      >
        {/* Dark navy panel */}
        <div
          className="hidden md:flex flex-col justify-between p-10 text-white"
          style={{
            background: "radial-gradient(120% 140% at 85% 0%, #0D4A73 0%, #0B2942 50%, #061D31 100%)",
          }}
        >
          <div>
            <NautiqLogo size={22} dark />
            <h1
              className="mt-8 leading-tight"
              style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF" }}
            >
              Predictive maintenance for real boat ownership.
            </h1>
            <p className="mt-4 max-w-sm leading-6" style={{ fontSize: 15, color: "rgba(159,186,206,0.9)" }}>
              Track trips, maintenance, spares, and engine hours in one place.
              Stay ahead of service needs instead of reacting late.
            </p>
          </div>
          <div
            className="p-4 text-sm"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.05)",
              color: "rgba(159,186,206,0.7)",
              fontSize: 13,
            }}
          >
            Keep your boat ready, your records clean, and your maintenance forecast visible.
          </div>
        </div>

        {/* White form panel */}
        <div className="p-6 sm:p-10" style={{ background: "#FFFFFF" }}>
          <div className="mx-auto max-w-sm">
            <div className="mb-8 md:hidden">
              <NautiqLogo size={20} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F2335" }}>Sign in</h2>
            <p className="mt-2" style={{ fontSize: 14, color: "#8593A0" }}>
              Access your boat and maintenance planner.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block"
                  style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full outline-none transition"
                  style={{
                    borderRadius: 11,
                    border: "1.5px solid #E0E6EC",
                    background: "#FFFFFF",
                    padding: "13px 15px",
                    fontSize: 14.5,
                    color: "#0F2335",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B7EB8";
                    e.target.style.boxShadow = "0 0 0 4px rgba(11,126,184,.14)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E0E6EC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: 13, color: "#8593A0" }}
                    className="hover:text-ocean-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full outline-none transition"
                  style={{
                    borderRadius: 11,
                    border: "1.5px solid #E0E6EC",
                    background: "#FFFFFF",
                    padding: "13px 15px",
                    fontSize: 14.5,
                    color: "#0F2335",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0B7EB8";
                    e.target.style.boxShadow = "0 0 0 4px rgba(11,126,184,.14)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E0E6EC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderRadius: 11,
                  padding: "13px 24px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  background: loading ? "#0A6A9E" : "linear-gradient(135deg,#15A0D6,#0B7EB8)",
                  boxShadow: "0 6px 16px rgba(11,126,184,.28)",
                  border: "none",
                }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              {status ? (
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    borderRadius: 11,
                    border: `1px solid ${isError ? "#F3C4C4" : "#B8E2C8"}`,
                    background: isError ? "#FDEBEB" : "#E7F6EE",
                    color: isError ? "#D83A3A" : "#1D9B55",
                    fontSize: 13,
                  }}
                >
                  {status}
                </div>
              ) : null}
            </form>

            <p className="mt-6" style={{ fontSize: 14, color: "#8593A0" }}>
              New to NautIQ?{" "}
              <Link
                href="/signup"
                style={{ fontWeight: 600, color: "#0B7EB8" }}
                className="hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
      {process.env.NEXT_PUBLIC_BUILD_TIME && (
        <p className="mt-4 text-xs" style={{ color: "#8593A0" }}>
          v{new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString(undefined, {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
