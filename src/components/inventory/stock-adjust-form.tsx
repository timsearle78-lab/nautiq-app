"use client";

import { useState } from "react";
import SaveSuccessBanner from "@/components/ui/save-success-banner";

export function StockAdjustForm({
  boatId,
  inventoryItemId,
}: {
  boatId: string;
  inventoryItemId: string;
}) {
  const [txType, setTxType] = useState("add");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdd = txType === "add";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: inventoryItemId,
          quantity: parseFloat(qty) || 1,
          transactionType: txType,
          reason: txType === "add" ? "Restocked" : txType === "consume" ? "Used" : "Stock correction",
          cost: isAdd && cost ? parseFloat(cost) : null,
          boatId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuccess("Updated");
      setQty("1");
      setCost("");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-100";

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-1.5">
      <select
        value={txType}
        onChange={(e) => setTxType(e.target.value)}
        className={inputCls}
      >
        <option value="add">Add</option>
        <option value="consume">Use</option>
        <option value="correct">Set</option>
      </select>

      <input
        type="number"
        min="0.01"
        step="0.01"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className={`w-16 ${inputCls}`}
      />

      {isAdd && (
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="cost"
            className={`w-20 pl-4 ${inputCls}`}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl btn-primary px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
      >
        {saving ? "…" : "Update"}
      </button>

      {error && <span className="text-xs text-red-600">{error}</span>}
      {success && <SaveSuccessBanner message={success} />}
    </form>
  );
}
