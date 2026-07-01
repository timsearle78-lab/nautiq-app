"use client";

import { useRef, useState, useActionState, useEffect } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { deleteBoat } from "@/app/(app)/settings/actions";
import { useRouter } from "next/navigation";

type Props = { boatId: string; boatName: string };

export function DeleteBoatDialog({ boatId, boatName }: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [state, action, pending] = useActionState(deleteBoat, {});

  useEffect(() => {
    if (open) {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  const confirmed = typed.trim() === boatName.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:border-red-300"
      >
        <Trash2 size={15} />
        Delete boat
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Delete boat</h2>
                  <p className="text-xs text-slate-500 mt-0.5">This cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Deleting <span className="font-semibold text-slate-900">{boatName}</span> will permanently remove all of its data including:
              </p>
              <ul className="space-y-1">
                {["All maintenance records", "All components and systems", "All trip logs", "All inventory items"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <label className="block text-sm font-medium text-red-800 mb-2">
                  Type <span className="font-bold">{boatName}</span> to confirm deletion
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={boatName}
                  disabled={pending}
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                />
              </div>

              {state.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}
            </div>

            {/* Footer */}
            <form action={action}>
              <input type="hidden" name="boat_id" value={boatId} />
              <input type="hidden" name="boat_name" value={boatName} />
              <input type="hidden" name="confirmed_name" value={typed} />
              <div className="flex gap-3 px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!confirmed || pending}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pending ? "Deleting…" : "Delete boat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
