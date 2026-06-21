"use client";

import Link from "next/link";
import { useState } from "react";
import { Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between bg-ocean-900 p-10 text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ocean-500 flex items-center justify-center shadow-lg shadow-ocean-900/50">
                <Anchor size={22} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">NautIQ</span>
            </div>
            <h1 className="mt-8 text-3xl font-semibold leading-tight">
              Predictive maintenance for real boat ownership.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ocean-100/80">
              Track trips, maintenance, spares, and engine hours in one place.
              Stay ahead of service needs instead of reacting late.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-ocean-100/70">
            Keep your boat ready, your records clean, and your maintenance forecast visible.
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-sm">
            {/* Mobile-only logo */}
            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div className="w-9 h-9 rounded-xl bg-ocean-600 flex items-center justify-center">
                <Anchor size={19} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">NautIQ</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">
              Access your boat and maintenance planner.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-slate-500 hover:text-ocean-600 transition-colors"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              {status ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    isError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  {status}
                </div>
              ) : null}
            </form>

            <p className="mt-6 text-sm text-slate-500">
              New to NautIQ?{" "}
              <Link href="/signup" className="font-medium text-ocean-600 hover:text-ocean-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
      {process.env.NEXT_PUBLIC_BUILD_TIME && (
        <p className="mt-4 text-xs text-slate-400">
          v{new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString(undefined, {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
