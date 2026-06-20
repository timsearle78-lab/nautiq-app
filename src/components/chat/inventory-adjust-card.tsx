"use client";

import { useState, useEffect } from "react";
import { PackagePlus, PackageMinus, Search } from "lucide-react";

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

function CreateItemCard({
  searchTerm,
  quantity: initialQty,
  boatId,
  onSaved,
}: {
  searchTerm: string;
  quantity: number;
  boatId: string;
  onSaved?: (itemName: string) => void;
}) {
  const [name, setName] = useState(searchTerm);
  const [category, setCategory] = useState("General");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(initialQty);
  const [componentId, setComponentId] = useState("");
  const [components, setComponents] = useState<{ id: string; name: string; system_name: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/boats/${boatId}/components`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComponents(data);
      })
      .catch(() => {});
  }, [boatId]);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId,
          name,
          category,
          unit,
          quantity: qty,
          componentId: componentId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        onSaved?.(data.item.name);
      } else {
        setError(data.error ?? "Failed to create item");
      }
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
        <span>✓</span>
        <span>"{name}" added to inventory</span>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-green-50 px-4 py-2.5">
        <PackagePlus size={16} className="text-green-600" />
        <span className="text-sm font-semibold text-slate-800">Create New Inventory Item</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-500">
          "{searchTerm}" wasn't found in your inventory. Fill in the details to create it.
        </p>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Item name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="e.g. Safety, Engine" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              <option value="">— select —</option>
              <option value="ea">ea (each)</option>
              <option value="L">L (litres)</option>
              <option value="mL">mL (millilitres)</option>
              <option value="kg">kg (kilograms)</option>
              <option value="g">g (grams)</option>
              <option value="m">m (metres)</option>
              <option value="pair">pair</option>
              <option value="set">set</option>
              <option value="roll">roll</option>
              <option value="box">box</option>
              <option value="can">can</option>
              <option value="tube">tube</option>
              <option value="bottle">bottle</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Initial quantity</label>
          <input type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Linked component <span className="font-normal text-slate-400">(optional)</span></label>
          <select value={componentId} onChange={(e) => setComponentId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.system_name ? ` (${c.system_name})` : ""}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create & add to inventory"}
        </button>
      </div>
    </div>
  );
}

export default function InventoryAdjustCard({
  searchTerm,
  matches,
  quantity: initialQty,
  transactionType,
  reason,
  boatId,
  onSaved,
  onDismiss,
}: InventoryAdjustCardProps) {
  const isAdd = transactionType === "add";
  const isPickerMode = !searchTerm || searchTerm.trim().length < 2 || matches.length > 5;
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState(!isPickerMode ? (matches[0]?.id ?? "") : "");
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
      <CreateItemCard
        searchTerm={searchTerm}
        quantity={initialQty}
        boatId={boatId}
        onSaved={onSaved}
      />
    );
  }

  const filteredMatches = isPickerMode && filter.trim()
    ? matches.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()))
    : matches;

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 ${isAdd ? "bg-green-50" : "bg-slate-50"}`}>
        {isAdd
          ? <PackagePlus size={16} className="text-green-600" />
          : <PackageMinus size={16} className="text-slate-500" />
        }
        <span className="text-sm font-semibold text-slate-800">
          {isAdd ? "Restock Inventory" : "Which part did you use?"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Picker mode: searchable list */}
        {isPickerMode ? (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search your inventory…"
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-100"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-50">
              {filteredMatches.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400">No matching items</p>
              ) : filteredMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition ${
                    selectedId === item.id
                      ? "bg-ocean-50 text-ocean-700 font-medium"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {item.quantity} {item.unit ?? "units"} in stock
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : matches.length > 1 ? (
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



