"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

interface Component {
  id: string;
  name: string;
  system_name?: string | null;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
}

interface MaintenanceDraftCardProps {
  componentName: string;
  workDone: string;
  performedAt: string;
  notes?: string;
  engineHoursAtService?: number | null;
  components: Component[];
  inventoryItems?: InventoryItem[];
  boatId: string;
}

export default function ChatMaintenanceDraftCard({
  componentName,
  workDone,
  performedAt,
  notes: initialNotes,
  engineHoursAtService,
  components,
  inventoryItems = [],
  boatId,
}: MaintenanceDraftCardProps) {
  const today = new Date().toISOString().slice(0, 10);

  const findBestMatch = (name: string) => {
    if (!name) return "";
    const lower = name.toLowerCase();
    return components.find((c) => c.name.toLowerCase().includes(lower))?.id ?? "";
  };

  const [componentId, setComponentId] = useState(findBestMatch(componentName));
  const [date, setDate] = useState(performedAt || today);
  const [work, setWork] = useState(workDone);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [hours, setHours] = useState(engineHoursAtService?.toString() ?? "");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [inventoryQty, setInventoryQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  if (saved) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✓ Maintenance logged
      </div>
    );
  }

  const canSave = !!componentId && !!date && !!work.trim();
  const selectedInvItem = inventoryItems.find((i) => i.id === inventoryItemId);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/maintenance/save-from-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId,
          componentId,
          performedAt: date,
          workDone: work,
          notes: notes || null,
          engineHoursAtService: hours ? parseFloat(hours) : null,
          inventoryItemId: inventoryItemId || null,
          inventoryQuantityUsed: inventoryItemId ? (parseFloat(inventoryQty) || 1) : 0,
        }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <Wrench size={15} className="text-ocean-600" />
        <span className="text-sm font-semibold text-slate-800">Log maintenance</span>
        <span className="ml-auto text-xs text-slate-400">Review before saving</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Component picker */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Component</label>
          <select
            value={componentId}
            onChange={(e) => setComponentId(e.target.value)}
            className={inputCls}
          >
            <option value="">— select component —</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.system_name ? ` (${c.system_name})` : ""}
              </option>
            ))}
          </select>
          {!componentId && (
            <p className="text-xs text-amber-600 mt-1">No exact match found — please select the component</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date performed</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Work done */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Work done</label>
          <input
            type="text"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            className={inputCls}
            placeholder="e.g. Changed engine oil and filter"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
            placeholder="e.g. Used 5W-30 synthetic"
          />
        </div>

        {/* Engine hours */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Engine hours at service (optional)</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputCls}
            placeholder="e.g. 342"
            min="0"
            step="0.1"
          />
        </div>

        {/* Inventory consumption */}
        {inventoryItems.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">Parts used from inventory (optional)</label>
            <select
              value={inventoryItemId}
              onChange={(e) => setInventoryItemId(e.target.value)}
              className={inputCls}
            >
              <option value="">— none —</option>
              {inventoryItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.quantity} {i.unit ?? "ea"} in stock)
                </option>
              ))}
            </select>
            {selectedInvItem && (
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-slate-500 whitespace-nowrap">Quantity used</label>
                <input
                  type="number"
                  value={inventoryQty}
                  onChange={(e) => setInventoryQty(e.target.value)}
                  className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none"
                  min="1"
                  step="1"
                />
                <span className="text-xs text-slate-400">{selectedInvItem.unit ?? "ea"}</span>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Dismiss
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
