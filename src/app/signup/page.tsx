"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [boatName, setBoatName] = useState("");
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
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: name || null,
            boat_name: boatName || null,
          },
        },
      });

      if (error) {
        throw error;
      }

      setStatus(
        "Account created. Check your email to confirm your account before signing in."
      );

      setName("");
      setBoatName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
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
                  Start tracking your boat like a serious owner.
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-300">
                  Log trips, track maintenance, forecast service work, and stay
                  ahead of critical spares.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                Built for real-world ownership, not just record keeping.
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-sm">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-950">
                  Create account
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Set up your NautIQ account to start logging trips and managing
                  maintenance.
                </p>
              </div>

              <form onSubmit={handleSignup} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-neutral-800"
                  >
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                    placeholder="Tim"
                  />
                </div>

                <div>
                  <label
                    htmlFor="boatName"
                    className="mb-1.5 block text-sm font-medium text-neutral-800"
                  >
                    Boat name
                  </label>
                  <input
                    id="boatName"
                    type="text"
                    value={boatName}
                    onChange={(e) => setBoatName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                    placeholder="Manhattan"
                  />
                </div>

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
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-neutral-800"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-medium text-neutral-800"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
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
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}