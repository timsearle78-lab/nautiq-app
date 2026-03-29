"use client";

import Link from "next/link";
import { useState } from "react";
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setStatus("Signed in successfully.");
      window.location.href = "/dashboard";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const isError =
    status &&
    status !== "Signed in successfully.";

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm md:grid-cols-2">
          <div className="hidden border-r border-neutral-200 bg-neutral-900 p-10 text-white md:block">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">
                  NautIQ
                </div>
                <h1 className="mt-6 text-3xl font-semibold leading-tight">
                  Predictive maintenance for real boat ownership.
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-300">
                  Track trips, maintenance, spares, and engine hours in one place.
                  Stay ahead of service needs instead of reacting late.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                Keep your boat ready, your records clean, and your maintenance
                forecast visible.
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-sm">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-950">
                  Sign in
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Access your boat dashboard and maintenance planner.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-neutral-800"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-neutral-800"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
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
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
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

              <p className="mt-6 text-sm text-neutral-600">
                New to NautIQ?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}