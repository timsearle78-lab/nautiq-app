"use client";

import { useState } from "react";

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
  quantityUsed: number;
  reason: string;
  boatId: string;
  onSaved?: (itemName: string) => void;
  onDismiss?: () => void;
}

export default function InventoryAdjustCard({
  searchTerm,
  matches,
  quantityUsed,
  reason,
  onSaved,
  onDismiss,
}: InventoryAdjustCardProps) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? "");
  const [qty, setQty] = useState(quantityUsed);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedItem = matches.find((m) => m.id === selectedId);

  async function handleConfirm() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedId, quantityUsed: qty, reason }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        onSaved?.(data.itemName);
      }
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✓ Inventory updated
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        No inventory item found matching "{searchTerm}". Add it in the Inventory tab.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-base">📦</span>
        <span className="text-sm font-semibold text-slate-800">Update Inventory</span>
      </div>

      <div className="p-4 space-y-3">
        {matches.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
            >
              {matches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (have {item.quantity})
                </option>
              ))}
            </select>
          </div>
        )}

        {matches.length === 1 && (
          <div className="text-sm text-slate-700 font-medium">{selectedItem?.name}</div>
        )}

        {selectedItem && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Current: {selectedItem.quantity} {selectedItem.unit ?? "units"}</span>
            <span>→</span>
            <span className={Math.max(0, selectedItem.quantity - qty) <= selectedItem.minimum_quantity ? "text-red-600 font-medium" : "text-slate-700"}>
              After: {Math.max(0, selectedItem.quantity - qty)} {selectedItem.unit ?? "units"}
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity used</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <p className="text-xs text-slate-400">{reason}</p>
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleConfirm}
          disabled={saving || !selectedId}
          className="flex-1 rounded-lg bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Confirm"}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
