"use client";

import { useActionState, useState } from "react";
import { X, ScanLine, ChevronDown, ChevronUp } from "lucide-react";
import SaveSuccessSheet from "@/components/ui/save-success-sheet";
import { createInventoryItem, adjustInventoryStock } from "@/lib/inventory/actions";

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

const UNITS = ["ea", "pair", "set", "L", "mL", "kg", "g", "m", "roll", "box", "can", "tube", "bottle"];

interface Props {
  boatId: string;
  scanResult: ScanResult;
  components: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ScanConfirmSheet({ boatId, scanResult, components, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<"update" | "new">(scanResult.matchedItem ? "update" : "new");
  const [showDetails, setShowDetails] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [qty, setQty] = useState(String(scanResult.quantity || 1));
  const [unit, setUnit] = useState(scanResult.unit ?? "ea");
  const [txType, setTxType] = useState("add");

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

  if (savedOk) return <SaveSuccessSheet message="Inventory updated!" />;

  const matched = scanResult.matchedItem;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <ScanLine size={16} className="text-ocean-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                {scanResult.itemName}
              </h2>
              <p className="text-xs text-slate-400">
                AI identified · {scanResult.confidence === "low" ? "low confidence" : scanResult.confidence === "high" ? "high confidence" : "medium confidence"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-5 pb-8 space-y-5">

          {/* Matched item — update flow */}
          {matched && mode === "update" && (
            <form action={adjustAction} className="space-y-4">
              <input type="hidden" name="boat_id" value={boatId} />
              <input type="hidden" name="inventory_item_id" value={matched.id} />

              <div className="rounded-xl border border-ocean-200 bg-ocean-50 p-3.5 space-y-1">
                <p className="text-xs font-semibold text-ocean-700">Matched existing item</p>
                <p className="text-sm font-medium text-slate-800">{matched.name}</p>
                <p className="text-xs text-slate-500">
                  Current stock: <span className="font-semibold text-slate-700">{matched.quantity}{matched.unit ? ` ${matched.unit}` : ""}</span>
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">What do you want to do?</label>
                <select
                  name="transaction_type"
                  value={txType}
                  onChange={e => setTxType(e.target.value)}
                  className="select-field"
                >
                  <option value="add">Add to stock (bought / received)</option>
                  <option value="consume">Remove from stock (used / lost)</option>
                  <option value="correct">Set exact quantity</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {txType === "correct" ? "New total quantity" : "Quantity"}
                </label>
                <div className="flex gap-2">
                  <input
                    name="quantity_delta"
                    type="number"
                    min="0"
                    step="1"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    required
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    className="select-field"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {txType === "add" && (
                  <p className="mt-1 text-xs text-slate-400">
                    New total: {(Number(matched.quantity) + Number(qty || 0)).toFixed(qty.includes(".") ? 2 : 0)}{matched.unit ? ` ${matched.unit}` : ""}
                  </p>
                )}
                {txType === "consume" && (
                  <p className="mt-1 text-xs text-slate-400">
                    New total: {Math.max(0, Number(matched.quantity) - Number(qty || 0)).toFixed(qty.includes(".") ? 2 : 0)}{matched.unit ? ` ${matched.unit}` : ""}
                  </p>
                )}
              </div>

              {adjustState.error && <p className="text-sm text-red-600">{adjustState.error}</p>}

              <button
                type="submit"
                disabled={adjustPending}
                className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
                style={{ background: "#0B7EB8" }}
              >
                {adjustPending ? "Saving…" : "Update stock"}
              </button>

              <button
                type="button"
                onClick={() => setMode("new")}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition"
              >
                Not the same item? Add as new instead
              </button>
            </form>
          )}

          {/* New item flow */}
          {mode === "new" && (
            <form action={createAction} className="space-y-4">
              <input type="hidden" name="boat_id" value={boatId} />
              <input type="hidden" name="name" value={scanResult.itemName} />
              <input type="hidden" name="category" value={scanResult.category ?? ""} />
              <input type="hidden" name="manufacturer" value={scanResult.manufacturer ?? ""} />
              <input type="hidden" name="sku" value={scanResult.sku ?? ""} />
              <input type="hidden" name="notes" value={scanResult.notes ?? ""} />
              <input type="hidden" name="component_id" value={scanResult.suggestedComponentId ?? ""} />

              {matched && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs text-slate-500">Adding as a separate item from <span className="font-medium text-slate-700">{matched.name}</span></p>
                </div>
              )}

              {!matched && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{scanResult.itemName}</span> isn&apos;t in your inventory yet.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">How many do you have on board?</label>
                <div className="flex gap-2">
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    required
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    name="unit"
                    className="select-field"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional details — collapsed by default */}
              <button
                type="button"
                onClick={() => setShowDetails(v => !v)}
                className="flex items-center gap-1.5 text-sm text-ocean-600 hover:text-ocean-700 transition font-medium"
              >
                {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showDetails ? "Hide details" : "Add more details (name, category, notes…)"}
              </button>

              {showDetails && (
                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                    <input
                      name="name_override"
                      defaultValue={scanResult.itemName}
                      className={inputCls}
                      onChange={e => {
                        const hidden = e.currentTarget.form?.elements.namedItem("name") as HTMLInputElement | null;
                        if (hidden) hidden.value = e.currentTarget.value;
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                      <input name="category_override" defaultValue={scanResult.category ?? ""} placeholder="e.g. Personal" className={inputCls}
                        onChange={e => {
                          const hidden = e.currentTarget.form?.elements.namedItem("category") as HTMLInputElement | null;
                          if (hidden) hidden.value = e.currentTarget.value;
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Linked component</label>
                      <select name="component_id" defaultValue={scanResult.suggestedComponentId ?? ""} className="select-field">
                        <option value="">None</option>
                        {components.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Min qty (low stock alert)</label>
                      <input name="minimum_quantity" type="number" min="0" step="1" className={inputCls} placeholder="0" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Manufacturer</label>
                      <input name="manufacturer" defaultValue={scanResult.manufacturer ?? ""} className={inputCls} placeholder="Optional" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
                    <input name="notes" defaultValue={scanResult.notes ?? ""} className={inputCls} placeholder="Optional" />
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" name="is_critical" defaultChecked={scanResult.is_critical} className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
                    Mark as critical spare
                  </label>
                </div>
              )}

              {createState.error && <p className="text-sm text-red-600">{createState.error}</p>}

              <button
                type="submit"
                disabled={createPending}
                className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
                style={{ background: "#0B7EB8" }}
              >
                {createPending ? "Saving…" : `Add ${qty || "1"} ${unit} to inventory`}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
