"use client";

import { useState } from "react";
import { PackagePlus, PackageMinus } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit?: string;
  category?: string;
}

interface InventoryAdjustCardProps {
  searchTerm: string;
  matches: InventoryItem[];
  quantity: number;
  transactionType: "add" | "consume";
  reason: string;
  boatId: string;
  onSaved?: (itemName: string) => void;
  onDismiss?: () => void;
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-100";

export default function InventoryAdjustCard({
  searchTerm,
  matches,
  quantity: initialQty,
  transactionType,
  reason,
  onSaved,
  onDismiss,
}: InventoryAdjustCardProps) {
  const isAdd = transactionType === "add";
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? "");
  const [qty, setQty] = useState(initialQty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = matches.find((m) => m.id === selectedId);
  const previewQty = selectedItem
    ? isAdd
      ? selectedItem.quantity + qty
      : Math.max(0, selectedItem.quantity - qty)
    : null;
  const isLow =
    selectedItem &&
    previewQty != null &&
    previewQty <= (selectedItem.minimum_quantity ?? 0);

  async function handleConfirm() {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedId,
          quantity: qty,
          transactionType,
          reason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        onSaved?.(data.itemName);
      } else {
        setError(data.error ?? "Update failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
        <span>✓</span>
        <span>Inventory {isAdd ? "restocked" : "updated"}</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        No inventory item found matching "{searchTerm}". Add it in the Inventory tab first.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 ${isAdd ? "bg-green-50" : "bg-slate-50"}`}>
        {isAdd
          ? <PackagePlus size={16} className="text-green-600" />
          : <PackageMinus size={16} className="text-slate-500" />
        }
        <span className="text-sm font-semibold text-slate-800">
          {isAdd ? "Restock Inventory" : "Use from Inventory"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Item selector */}
        {matches.length > 1 ? (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={inputCls}
            >
              {matches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-sm font-medium text-slate-800">{selectedItem?.name}</div>
        )}

        {/* Stock preview */}
        {selectedItem && previewQty != null && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm">
            <span className="text-slate-500">
              {selectedItem.quantity} {selectedItem.unit ?? "units"}
            </span>
            <span className="text-slate-400">{isAdd ? "+" : "−"}{qty}</span>
            <span className="text-slate-400">→</span>
            <span className={`font-semibold ${isLow ? "text-amber-600" : isAdd ? "text-green-600" : "text-slate-700"}`}>
              {previewQty} {selectedItem.unit ?? "units"}
            </span>
            {isLow && <span className="text-xs text-amber-500 ml-1">(below min)</span>}
          </div>
        )}

        {/* Quantity input */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {isAdd ? "Quantity added" : "Quantity used"}
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={qty}
            onChange={(e) => setQty(parseFloat(e.target.value) || 1)}
            className={inputCls}
          />
        </div>

        {reason && <p className="text-xs text-slate-400">{reason}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleConfirm}
          disabled={saving || !selectedId}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
            isAdd ? "bg-green-600 hover:bg-green-700" : "bg-ocean-600 hover:bg-ocean-700"
          }`}
        >
          {saving ? "Saving…" : isAdd ? "Confirm restock" : "Confirm use"}
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
