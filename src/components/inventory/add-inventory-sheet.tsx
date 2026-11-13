"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Package, Layers } from "lucide-react";
import { AddInventoryItemForm } from "./add-inventory-item-form";
import { BulkAddInventorySheet } from "./bulk-add-inventory-sheet";

type ComponentOption = { id: string; name: string };
type Mode = "single" | "bulk";

export function AddInventorySheet({
  boatId,
  components,
  categories,
}: {
  boatId: string;
  components: ComponentOption[];
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("single");
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl btn-amber px-4 py-2.5 text-sm font-semibold transition"
      >
        + Add
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={handleClose}
          />

          {mode === "bulk" ? (
            <BulkAddInventorySheet
              boatId={boatId}
              categories={categories}
              onClose={handleClose}
              onSuccess={handleSuccess}
            />
          ) : (
            /* Single-item sheet */
            <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
              {/* Sheet header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-ocean-600" />
                  <h2 className="text-base font-semibold text-slate-900">Add inventory item</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode toggle */}
              <div className="px-4 pt-3 pb-0">
                <button
                  type="button"
                  onClick={() => setMode("bulk")}
                  className="flex items-center gap-1.5 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
                >
                  <Layers size={14} />
                  Switch to bulk add
                </button>
              </div>

              <div className="px-4 py-4 pb-8">
                <AddInventoryItemForm
                  boatId={boatId}
                  components={components}
                  categories={categories}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
