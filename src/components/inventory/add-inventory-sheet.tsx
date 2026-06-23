"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { AddInventoryItemForm } from "./add-inventory-item-form";

type ComponentOption = { id: string; name: string };

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
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 active:bg-ocean-700"
      >
        <Plus size={16} />
        Add item
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            {/* Sheet header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-slate-900">Add inventory item</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
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
        </>
      )}
    </>
  );
}
