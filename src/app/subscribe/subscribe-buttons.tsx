"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscribeButtons({ interval }: { interval: "monthly" | "annual" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Redirecting to checkout…" : `Subscribe ${interval}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
