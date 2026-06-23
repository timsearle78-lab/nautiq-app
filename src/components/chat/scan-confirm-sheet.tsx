"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { createInventoryItem, adjustInventoryStock } from "@/lib/inventory/actions";
import VoiceTextarea from "@/components/ui/voice-textarea";

export type ScanResult = {
  itemName: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  manufacturer: string | null;
  sku: string | null;
  is_critical: boolean;
  notes: string | null;
  confidence: string;
  matchedItem: { id: string; name: string; quantity: number; unit: string | null; minimum_quantity: number | null } | null;
  suggestedComponentId: string | null;
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

interface Props {
  boatId: string;
  scanResult: ScanResult;
  components: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ScanConfirmSheet({ boatId, scanResult, components, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<"update" | "new">(scanResult.matchedItem ? "update" : "new");
  const [notes, setNotes] = useState(scanResult.notes ?? "");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const [createState, createAction, createPending] = useActionState(
    async (prev: { error?: string; success?: string }, fd: FormData) => {
      const result = await createInventoryItem(prev, fd);
      if (result.success) { setSavedOk(true); setTimeout(onSaved, 1200); }
      return result;
    },
    {}
  );

  const [adjustState, adjustAction, adjustPending] = useActionState(
    async (prev: { error?: string; success?: string }, fd: FormData) => {
      const result = await adjustInventoryStock(prev, fd);
      if (result.success) { setSavedOk(true); setTimeout(onSaved, 1200); }
      return result;
    },
    {}
  );

  if (savedOk) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/30" />
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200">
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-900">Inventory updated!</p>
          </div>
        </div>
      </>
    );
  }

  const matched = scanResult.matchedItem;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "update" ? "Update existing item" : "Add inventory item"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI scanned: <span className="font-medium text-slate-700">{scanResult.itemName}</span>
              {scanResult.confidence === "low" && " · low confidence"}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle when a match was found */}
        {matched && (
          <div className="px-4 pt-3">
            <div className="rounded-xl border border-ocean-200 bg-ocean-50 p-3">
              <p className="text-xs font-semibold text-ocean-700 mb-0.5">Similar item found</p>
              <p className="text-sm text-slate-700">
                <span className="font-medium">{matched.name}</span>
                {" · "}current stock: <span className="font-semibold">{matched.quantity}{matched.unit ? ` ${matched.unit}` : ""}</span>
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setMode("update")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${mode === "update" ? "bg-ocean-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Update this item
                </button>
                <button
                  onClick={() => setMode("new")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${mode === "new" ? "bg-ocean-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Add as new
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4 space-y-4">
          {mode === "update" && matched ? (
            <form action={adjustAction} className="space-y-4">
              <input type="hidden" name="boat_id" value={boatId} />
              <input type="hidden" name="inventory_item_id" value={matched.id} />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Transaction type</label>
                <select name="transaction_type" defaultValue="add" className={inputCls}>
                  <option value="add">Add to stock (bought/received)</option>
                  <option value="consume">Remove from stock (used)</option>
                  <option value="correct">Set stock to exact quantity</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity</label>
                <input
                  name="quantity_delta"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={scanResult.quantity}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
                <VoiceTextarea value={adjustNotes} onChange={setAdjustNotes} placeholder="Optional reason or detail…" rows={2} />
                <input type="hidden" name="notes" value={adjustNotes} />
              </div>

              {adjustState.error && <p className="text-sm text-red-600">{adjustState.error}</p>}

              <button
                type="submit"
                disabled={adjustPending}
                className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
              >
                {adjustPending ? "Saving…" : `Update "${matched.name}"`}
              </button>
            </form>
          ) : (
            <form action={createAction} className="space-y-4">
              <input type="hidden" name="boat_id" value={boatId} />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                <input name="name" required defaultValue={scanResult.itemName} className={inputCls} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                  <input name="category" defaultValue={scanResult.category ?? ""} className={inputCls} placeholder="Engine" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Linked component</label>
                  <select name="component_id" defaultValue={scanResult.suggestedComponentId ?? ""} className={inputCls}>
                    <option value="">None</option>
                    {components.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Qty <span className="text-red-500">*</span></label>
                  <input name="quantity" type="number" min="0" step="0.01" defaultValue={scanResult.quantity} required className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Min qty</label>
                  <input name="minimum_quantity" type="number" min="0" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
                  <select name="unit" defaultValue={scanResult.unit ?? ""} className={inputCls}>
                    <option value="">—</option>
                    <option value="ea">ea</option>
                    <option value="L">L</option>
                    <option value="mL">mL</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="m">m</option>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Manufacturer</label>
                  <input name="manufacturer" defaultValue={scanResult.manufacturer ?? ""} className={inputCls} placeholder="Optional" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU / Part #</label>
                  <input name="sku" defaultValue={scanResult.sku ?? ""} className={inputCls} placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
                <VoiceTextarea value={notes} onChange={setNotes} placeholder="Additional details…" rows={2} />
                <input type="hidden" name="notes" value={notes} />
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" name="is_critical" defaultChecked={scanResult.is_critical} className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
                Mark as critical spare
              </label>

              {createState.error && <p className="text-sm text-red-600">{createState.error}</p>}

              <button
                type="submit"
                disabled={createPending}
                className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
              >
                {createPending ? "Saving…" : "Add to inventory"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
