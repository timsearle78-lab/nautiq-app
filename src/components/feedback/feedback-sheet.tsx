"use client";

import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";

interface FeedbackSheetProps {
  onClose: () => void;
  /** When true renders as an inline sub-view (no backdrop/fixed positioning) */
  inline?: boolean;
}

export default function FeedbackSheet({ onClose, inline = false }: FeedbackSheetProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit() {
    if (!score) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();
      setStatus(data.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 -ml-1">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-slate-800">Share feedback</h2>
      </div>

      <div className="overflow-y-auto px-5 py-5 space-y-6">
        {status === "sent" ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">🙏</div>
            <p className="text-base font-semibold text-slate-800">Thanks for your feedback!</p>
            <p className="text-sm text-slate-500">It goes directly to the NautIQ team and helps us improve the app.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-ocean-600 text-white text-sm font-semibold hover:bg-ocean-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                How likely are you to recommend NautIQ to another boatie?
              </p>
              <p className="text-xs text-slate-400 mb-3">1 = Not at all likely &nbsp;·&nbsp; 10 = Extremely likely</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const selected = score === n;
                  const color = n >= 9 ? "#16a34a" : n >= 7 ? "#d97706" : "#dc2626";
                  const bgSelected = n >= 9 ? "#f0fdf4" : n >= 7 ? "#fffbeb" : "#fef2f2";
                  const borderSelected = n >= 9 ? "#86efac" : n >= 7 ? "#fde68a" : "#fca5a5";
                  return (
                    <button
                      key={n}
                      onClick={() => setScore(n)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border: `1.5px solid ${selected ? borderSelected : "#e2e8f0"}`,
                        background: selected ? bgSelected : "#f8fafc",
                        color: selected ? color : "#64748b",
                        fontWeight: selected ? 800 : 600,
                        fontSize: 15,
                        transition: "all 0.12s",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Anything else you&apos;d like to share? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What's working well? What could be better? Any features you'd love to see?"
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong — please try again.</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!score || status === "sending"}
              className="w-full py-3 rounded-xl bg-ocean-600 text-white text-sm font-semibold hover:bg-ocean-700 transition-colors disabled:opacity-40"
            >
              {status === "sending" ? "Sending…" : "Send feedback"}
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1040px] z-50 bg-white rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)] max-h-[85dvh] flex flex-col">
        {content}
      </div>
    </>
  );
}
