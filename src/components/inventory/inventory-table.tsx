import { StockAdjustForm } from "@/components/inventory/stock-adjust-form";
import type { InventoryItemRow } from "@/lib/inventory/queries";
import Link from "next/link";

function getStatus(item: InventoryItemRow) {
  if (item.is_critical && Number(item.quantity) <= 0) {
    return { label: "Missing critical", className: "text-red-700" };
  }

  if (
    item.minimum_quantity != null &&
    Number(item.quantity) < Number(item.minimum_quantity)
  ) {
    return { label: "Low stock", className: "text-amber-700" };
  }

  return { label: "OK", className: "text-green-700" };
}

export function InventoryTable({
  boatId,
  items,
}: {
  boatId: string;
  items: InventoryItemRow[];
}) {
  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-lg font-semibold">Inventory list</h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">No inventory items found.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Component</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Min</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = getStatus(item);

                return (
                  <tr key={item.id} className="border-b align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-neutral-500">
                        {item.category ?? "Uncategorised"}
                        {item.is_critical ? " · Critical" : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                        {item.component ? (
                          <Link href={`/components/${item.component.id}`} className="underline">
                            {item.component.name}
                          </Link>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                    </td>
                    <td className="py-3 pr-4">
                      {item.quantity} {item.unit ?? ""}
                    </td>
                    <td className="py-3 pr-4">
                      {item.minimum_quantity ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="py-3 pr-4">
                      {item.storage_location ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td className={`py-3 pr-4 font-medium ${status.className}`}>
                      {status.label}
                    </td>
                    <td className="py-3 pr-4">
                      <StockAdjustForm boatId={boatId} inventoryItemId={item.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}