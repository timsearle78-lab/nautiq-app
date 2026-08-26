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
          <div style={{ marginBottom: 16 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="28" cy="28" r="28" fill="#E6F3FA"/>
              <g transform="translate(12,10)">
                <path d="M16 4C16 4 16 8 16 10C18.2 10 20 11.8 20 14C20 16.2 18.2 18 16 18C13.8 18 12 16.2 12 14C12 11.8 13.8 10 16 10" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="4" r="2" fill="#0B7EB8"/>
                <path d="M8 14H24" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 18V30" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 30C8 30 10 26 16 26C22 26 24 30 24 30" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 30L8 36" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 30L24 36" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 34H26" stroke="#0B7EB8" strokeWidth="2" strokeLinecap="round"/>
              </g>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0f2335", marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, maxWidth: 300 }}>
            NautIQ ran into an unexpected problem. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "white", background: "#0B7EB8", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
