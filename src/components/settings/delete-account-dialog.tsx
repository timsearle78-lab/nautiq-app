"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

const CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmed = typed === CONFIRMATION_PHRASE;

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete account. Please try again.");
      setLoading(false);
      return;
    }

    // Sign out locally and redirect
    window.location.href = "/login";
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
      >
        <Trash2 size={16} />
        Delete my account
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => !loading && setOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-sm mx-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <h2 className="text-base font-semibold text-slate-800">Delete account</h2>
              </div>
              {!loading && (
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1">
                  <X size={18} />
                </button>
              )}
            </div>

            <p className="text-sm text-slate-600 mb-4">
              This will permanently delete your account and all data — boats, maintenance records, trips, inventory, and photos. <strong>This cannot be undone.</strong>
            </p>

            <p className="text-xs font-semibold text-slate-700 mb-2">
              Type <span className="font-mono text-red-600">{CONFIRMATION_PHRASE}</span> to confirm
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRMATION_PHRASE}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50"
              autoCapitalize="characters"
            />

            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!confirmed || loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
