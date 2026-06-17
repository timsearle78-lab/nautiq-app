import { StockAdjustForm } from "@/components/inventory/stock-adjust-form";
import type { InventoryItemRow } from "@/lib/inventory/queries";
import Link from "next/link";

function getStatus(item: InventoryItemRow) {
  if (item.is_critical && Number(item.quantity) <= 0) {
    return { label: "Missing", badgeCls: "bg-red-50 text-red-600 border-red-200" };
  }
  if (item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity)) {
    return { label: "Low", badgeCls: "bg-amber-50 text-amber-600 border-amber-200" };
  }
  return { label: "OK", badgeCls: "bg-green-50 text-green-600 border-green-200" };
}

export function InventoryTable({
  boatId,
  items,
}: {
  boatId: string;
  items: InventoryItemRow[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">
          Inventory <span className="ml-1.5 text-sm font-normal text-slate-400">({items.length})</span>
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">No inventory items found.</p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {items.map((item) => {
              const status = getStatus(item);
              return (
                <div key={item.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{item.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.category ?? "Uncategorised"}
                        {item.is_critical ? " · Critical" : ""}
                        {item.storage_location ? ` · ${item.storage_location}` : ""}
                      </div>
                      {item.component && (
                        <Link href={`/components/${item.component.id}`} className="text-xs text-ocean-600 hover:text-ocean-700 font-medium mt-0.5 inline-block">
                          {item.component.name}
                        </Link>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-slate-800">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${status.badgeCls}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <StockAdjustForm boatId={boatId} inventoryItemId={item.id} />
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Item</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Component</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Min</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const status = getStatus(item);
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {item.category ?? "Uncategorised"}
                          {item.is_critical ? " · Critical" : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.component ? (
                          <Link href={`/components/${item.component.id}`} className="text-ocean-600 hover:text-ocean-700 font-medium">
                            {item.component.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.minimum_quantity ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.storage_location ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.badgeCls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StockAdjustForm boatId={boatId} inventoryItemId={item.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
