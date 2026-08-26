"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
      <p className="text-sm text-slate-500 mb-2 max-w-xs">
        {error.message || "An unexpected error occurred loading the admin page."}
      </p>
      <button
        onClick={reset}
        className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "#0B7EB8" }}
      >
        Try again
      </button>
    </div>
  );
}
