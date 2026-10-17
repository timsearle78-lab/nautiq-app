"use client";

import { useState, useTransition } from "react";
import { Mail, Package, X, Check, Plus } from "lucide-react";
import type { InventoryPurchaseDraft, ParsedPurchaseItem } from "@/lib/inventory-purchase-drafts";
import { dismissPurchaseDraft } from "@/lib/inventory-purchase-drafts";
import { applyPurchaseDraft, type PurchaseItemAction } from "@/lib/inventory/purchase-draft-actions";

type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };

interface Props {
  draft: InventoryPurchaseDraft;
  boatId: string;
  inventoryOptions: InventoryOption[];
  onDone: () => void;
}

function findMatch(item: ParsedPurchaseItem, inventory: InventoryOption[]): InventoryOption | null {
  const needle = item.name.toLowerCase();
  return inventory.find(
    (inv) =>
      inv.name.toLowerCase().includes(needle) ||
      needle.includes(inv.name.toLowerCase())
  ) ?? null;
}

export default function InventoryPurchaseDraftCard({ draft, boatId, inventoryOptions, onDone }: Props) {
  const [included, setIncluded] = useState<boolean[]>(draft.parsed_items.map(() => true));
  const [isPending, startTransition] = useTransition();
  const [isDismissing, startDismiss] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const matches = draft.parsed_items.map((item) => findMatch(item, inventoryOptions));

  function toggleItem(i: number) {
    setIncluded((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleDismiss() {
    startDismiss(async () => {
      await dismissPurchaseDraft(draft.id);
      onDone();
    });
  }

  function handleApply() {
    setError(null);
    const actions: PurchaseItemAction[] = draft.parsed_items
      .map((item, i) => ({ item, match: matches[i], include: included[i] }))
      .filter(({ include }) => include)
      .map(({ item, match }) => ({
        name: item.name,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? null,
        price: item.price ?? null,
        notes: item.notes ?? null,
        existingItemId: match?.id ?? null,
      }));

    if (actions.length === 0) {
      handleDismiss();
      return;
    }

    startTransition(async () => {
      const result = await applyPurchaseDraft(draft.id, boatId, actions);
      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  const activeCount = included.filter(Boolean).length;

  return (
    <div className="mx-3 mt-3 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
        <div className="flex-shrink-0 mt-0.5 rounded-full bg-amber-100 p-1.5">
          <Mail size={14} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800">Purchase email received</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {draft.email_subject ?? "No subject"}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing}
          className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-amber-100 hover:text-slate-600 transition"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Items list */}
      <div className="px-4 pb-2 space-y-2">
        {draft.parsed_items.map((item, i) => {
          const match = matches[i];
          const on = included[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleItem(i)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
                on
                  ? "border-amber-300 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{item.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.quantity != null && (
                      <span className="text-xs text-slate-500">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                    {item.price != null && (
                      <span className="text-xs text-slate-400">${item.price.toFixed(2)}</span>
                    )}
                    {match ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Check size={10} />
                        Matches: {match.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        <Plus size={10} />
                        New item
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${on ? "bg-amber-400 border-amber-400" : "border-slate-300"}`}>
                  {on && <Check size={10} color="white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="px-4 pb-2 text-xs text-red-600">{error}</p>
      )}

      {/* Action */}
      <div className="px-4 pb-3.5">
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending || activeCount === 0}
          className="flex items-center gap-1.5 w-full justify-center rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: "#D9A300" }}
        >
          <Package size={14} />
          {isPending ? "Saving…" : `Add ${activeCount} item${activeCount !== 1 ? "s" : ""} to inventory`}
        </button>
      </div>
    </div>
  );
}
