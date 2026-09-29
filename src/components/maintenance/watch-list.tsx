"use client";

import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import WatchItemCard, { type WatchItem } from "./watch-item-card";
import AddWatchItemSheet from "./add-watch-item-sheet";
import ResolveWatchItemSheet from "./resolve-watch-item-sheet";

type ComponentOption = { id: string; name: string };
type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };

interface Props {
  boatId: string;
  initialItems: WatchItem[];
  components: ComponentOption[];
  inventoryOptions: InventoryOption[];
}

export default function WatchList({ boatId, initialItems, components, inventoryOptions }: Props) {
  const [items, setItems] = useState<WatchItem[]>(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [resolveItem, setResolveItem] = useState<WatchItem | null>(null);

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSaved() {
    setShowAdd(false);
    // Refresh by reloading the page so the server re-fetches items
    window.location.reload();
  }

  function handleResolved() {
    setResolveItem(null);
    window.location.reload();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-amber-500" />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-navy-500)", letterSpacing: "0.1em" }}>
            WATCH LIST
          </p>
          {items.length > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "var(--color-status-warning-fg)", color: "var(--color-amber-ink)" }}>
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
          style={{ background: "var(--color-app-bg)", border: "1.5px solid #DBE3EA", color: "var(--color-navy-700)" }}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full rounded-[18px] px-4 py-5 text-center transition hover:bg-slate-50"
          style={{ background: "#FFFFFF", border: "1.5px dashed #DBE3EA" }}
        >
          <Eye size={24} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">Nothing on the watch list</p>
          <p className="text-xs text-slate-400 mt-1">Tap to add something to keep an eye on</p>
        </button>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WatchItemCard
              key={item.id}
              item={item}
              boatId={boatId}
              components={components}
              inventoryOptions={inventoryOptions}
              onResolved={handleResolved}
              onDeleted={() => handleDeleted(item.id)}
              onMarkDone={(i) => setResolveItem(i)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddWatchItemSheet
          boatId={boatId}
          components={components}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}

      {resolveItem && (
        <ResolveWatchItemSheet
          boatId={boatId}
          watchItemId={resolveItem.id}
          watchItemTitle={resolveItem.title}
          watchItemComponentId={resolveItem.component_id}
          components={components}
          inventoryOptions={inventoryOptions}
          onClose={() => setResolveItem(null)}
          onSaved={handleResolved}
        />
      )}
    </section>
  );
}
