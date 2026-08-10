"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

interface Props {
  userId: string;
  userEmail: string;
  onDeleted: () => void;
}

export function DeleteUserDialog({ userId, userEmail, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function handleOpen() {
    setOpen(true);
    setConfirmation("");
    setError("");
  }

  function handleClose() {
    if (deleting) return;
    setOpen(false);
    setConfirmation("");
    setError("");
  }

  async function handleDelete() {
    if (confirmation !== userEmail) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setOpen(false);
        onDeleted();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete account. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition"
        title="Delete account"
      >
        <Trash2 size={13} />
        Delete
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={handleClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Delete account</h2>
                <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-1">
                This will permanently delete <span className="font-semibold text-slate-800">{userEmail}</span> and all their data. This cannot be undone.
              </p>

              <p className="text-sm text-slate-600 mt-3 mb-2">
                Type the account email to confirm:
              </p>
              <input
                type="email"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={userEmail}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-red-400 focus:outline-none"
                autoFocus
              />

              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleClose}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmation !== userEmail || deleting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
