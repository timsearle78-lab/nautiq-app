"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Layers, Plus, Trash2, Package } from "lucide-react";

type BulkRow = {
  id: number;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  is_critical: boolean;
  expiry_date: string;
  last_checked: string;
};

const UNITS = ["", "ea", "L", "mL", "kg", "g", "m", "pair", "set", "roll", "box", "can", "tube", "bottle"];

function emptyRow(id: number): BulkRow {
  return { id, name: "", category: "", quantity: "0", unit: "ea", is_critical: false, expiry_date: "", last_checked: "" };
}

const thCls = "px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap";
const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";
const selectCls = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function BulkAddInventorySheet({
  boatId,
  categories,
  onClose,
  onSuccess,
  onSwitchToSingle,
}: {
  boatId: string;
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToSingle?: () => void;
}) {
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(1), emptyRow(2), emptyRow(3)]);
  const [nextId, setNextId] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);

  const updateRow = useCallback((id: number, field: keyof BulkRow, value: string | boolean) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow(nextId)]);
    setNextId((n) => n + 1);
    setTimeout(() => {
      tableRef.current?.scrollTo({ top: tableRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, [nextId]);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    const filled = rows.filter((r) => r.name.trim());
    if (filled.length === 0) {
      setError("Add at least one item name before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId,
          items: filled.map((r) => ({
            name: r.name.trim(),
            category: r.category.trim() || null,
            quantity: parseFloat(r.quantity) || 0,
            unit: r.unit || null,
            is_critical: r.is_critical,
            expiry_date: r.expiry_date || null,
            last_checked: r.last_checked || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      router.refresh();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }, [rows, boatId, router, onSuccess]);

  const filledCount = rows.filter((r) => r.name.trim()).length;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-ocean-600" />
          <h2 className="text-base font-semibold text-slate-900">Bulk add items</h2>
          {filledCount > 0 && (
            <span className="text-xs font-medium text-ocean-700 bg-ocean-50 border border-ocean-200 rounded-full px-2 py-0.5">
              {filledCount} item{filledCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 pt-3 pb-0 flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-slate-500">Fill in as many rows as you need. Only rows with a name are saved.</p>
        {onSwitchToSingle && (
          <button
            type="button"
            onClick={onSwitchToSingle}
            className="flex items-center gap-1.5 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors ml-4 whitespace-nowrap"
          >
            <Package size={14} />
            Single item
          </button>
        )}
      </div>

      {/* Scrollable table area */}
      <div ref={tableRef} className="flex-1 overflow-auto px-4 py-3 min-h-0">
        <table className="w-full min-w-[700px] text-sm border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className={thCls} style={{ width: "24%" }}>Name *</th>
              <th className={thCls} style={{ width: "16%" }}>Category</th>
              <th className={thCls} style={{ width: "8%" }}>Qty</th>
              <th className={thCls} style={{ width: "8%" }}>Unit</th>
              <th className={thCls} style={{ width: "12%" }}>Expiry</th>
              <th className={thCls} style={{ width: "12%" }}>Last checked</th>
              <th className={thCls} style={{ width: "8%" }}>Critical</th>
              <th className={thCls} style={{ width: "4%" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-1">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    className={inputCls}
                    placeholder="Item name"
                  />
                </td>
                <td className="px-1">
                  <input
                    value={row.category}
                    onChange={(e) => updateRow(row.id, "category", e.target.value)}
                    list="bulk-category-options"
                    className={inputCls}
                    placeholder="Engine"
                    autoComplete="off"
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-1">
                  <select
                    value={row.unit}
                    onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                    className={selectCls}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u || "—"}</option>)}
                  </select>
                </td>
                <td className="px-1">
                  <input
                    type="date"
                    value={row.expiry_date}
                    onChange={(e) => updateRow(row.id, "expiry_date", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-1">
                  <input
                    type="date"
                    value={row.last_checked}
                    onChange={(e) => updateRow(row.id, "last_checked", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-1 text-center">
                  <input
                    type="checkbox"
                    checked={row.is_critical}
                    onChange={(e) => updateRow(row.id, "is_critical", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-ocean-600 focus:ring-ocean-500"
                  />
                </td>
                <td className="px-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                    aria-label="Remove row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="bulk-category-options">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
        >
          <Plus size={15} />
          Add row
        </button>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-xs text-slate-400">
            {filledCount === 0 ? "No items to save yet" : `${filledCount} item${filledCount !== 1 ? "s" : ""} ready to save`}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || filledCount === 0}
            className="rounded-xl btn-primary px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : `Save ${filledCount > 0 ? filledCount : ""} item${filledCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
