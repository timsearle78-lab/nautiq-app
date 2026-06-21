"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NautiqLogo from "@/components/ui/nautiq-logo";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { full_name: name || null },
        },
      });

      if (error) throw error;

      setStatus("Account created. Check your email to confirm your account before signing in.");
      setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  const isError =
    !!status &&
    !status.toLowerCase().includes("check your email") &&
    !status.toLowerCase().includes("account created");

  const inputStyle = {
    borderRadius: 11,
    border: "1.5px solid #E0E6EC",
    background: "#FFFFFF",
    padding: "13px 15px",
    fontSize: 14.5,
    color: "#0F2335",
    width: "100%",
    outline: "none",
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "#0B7EB8";
      e.target.style.boxShadow = "0 0 0 4px rgba(11,126,184,.14)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "#E0E6EC";
      e.target.style.boxShadow = "none";
    },
  };

  return (
    <div
      className="min-h-screen flex flex-col md:items-center md:justify-center md:px-4 md:py-10"
      style={{ background: "#EEF1F5" }}
    >
      <div className="w-full md:max-w-4xl flex flex-col md:grid md:grid-cols-2 md:rounded-3xl md:overflow-hidden md:shadow-2xl">
        {/* Navy branding panel */}
        <div
          className="flex flex-col gap-4 px-6 py-8 md:p-10 text-white md:justify-between"
          style={{
            background: "radial-gradient(120% 140% at 85% 0%, #0D4A73 0%, #0B2942 50%, #061D31 100%)",
          }}
        >
          <div>
            <NautiqLogo size={22} dark />
            <h1
              className="mt-5 leading-tight"
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF" }}
            >
              Start tracking your boat like a serious owner.
            </h1>
            <p className="mt-3 leading-6" style={{ fontSize: 14, color: "rgba(159,186,206,0.85)" }}>
              Log trips, track maintenance, forecast service work, and stay
              ahead of critical spares.
            </p>
          </div>
          <div
            className="hidden md:block p-4"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.05)",
              color: "rgba(159,186,206,0.7)",
              fontSize: 13,
            }}
          >
            Built for real-world ownership, not just record keeping.
          </div>
        </div>

        {/* White form panel */}
        <div className="flex-1 px-6 py-8 md:p-10" style={{ background: "#FFFFFF" }}>
          <div className="mx-auto max-w-sm">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F2335" }}>Create account</h2>
            <p className="mt-2" style={{ fontSize: 14, color: "#8593A0" }}>
              Set up your NautIQ account to start logging trips and managing maintenance.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block"
                  style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}
                >
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  {...focusHandlers}
                  placeholder="Tim"
                />
              </div>

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
                  style={inputStyle}
                  {...focusHandlers}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block"
                  style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  {...focusHandlers}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block"
                  style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  {...focusHandlers}
                  placeholder="Repeat your password"
                  required
                  minLength={8}
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
                  background: "linear-gradient(135deg,#15A0D6,#0B7EB8)",
                  boxShadow: "0 6px 16px rgba(11,126,184,.28)",
                  border: "none",
                  marginTop: 8,
                }}
              >
                {loading ? "Creating account…" : "Create account"}
              </button>

              {status ? (
                <div
                  className="px-4 py-3"
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
              Already have an account?{" "}
              <Link
                href="/login"
                style={{ fontWeight: 600, color: "#0B7EB8" }}
                className="hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
