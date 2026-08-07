"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: "24px", textAlign: "center", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚓</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0f2335", marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, maxWidth: 300 }}>
            NautIQ ran into an unexpected problem. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "white", background: "linear-gradient(135deg,#15A0D6,#0B7EB8)", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
