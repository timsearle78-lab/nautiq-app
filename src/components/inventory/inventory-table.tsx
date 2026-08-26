import { StockAdjustForm } from "@/components/inventory/stock-adjust-form";
import type { InventoryItemRow } from "@/lib/inventory/queries";
import Link from "next/link";
import { Pencil } from "lucide-react";

function getStatus(item: InventoryItemRow) {
  if (item.is_critical && Number(item.quantity) <= 0) {
    return { label: "MISSING", badgeCls: "badge badge-missing", edge: "row-edge-critical" };
  }
  if (item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity)) {
    return { label: "LOW", badgeCls: "badge badge-low", edge: "row-edge-warning" };
  }
  return { label: "OK", badgeCls: "badge badge-ok", edge: "row-edge-healthy" };
}

function getExpiryBadge(expiryDate: string | null): { label: string; cls: string } | null {
  if (!expiryDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate); expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (daysLeft < 0) return { label: "EXPIRED", cls: "badge badge-missing" };
  if (daysLeft === 0) return { label: "EXP TODAY", cls: "badge badge-missing" };
  if (daysLeft <= 30) return { label: `EXP ${daysLeft}D`, cls: "badge badge-missing" };
  if (daysLeft <= 90) return { label: `EXP ${daysLeft}D`, cls: "badge badge-low" };
  return null;
}

export function InventoryTable({
  boatId,
  items,
}: {
  boatId: string;
  items: InventoryItemRow[];
}) {
  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3" style={{ borderBottom: "1.5px solid #DBE3EA" }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0B2942" }}>
          Inventory <span style={{ fontSize: 13, fontWeight: 500, color: "#8FB3CC", marginLeft: 6 }}>({items.length})</span>
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6" style={{ fontSize: 14, color: "#8FB3CC" }}>No inventory items found.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: "#DBE3EA" }}>
          {items.map((item) => {
            const status = getStatus(item);
            const expiryBadge = getExpiryBadge(item.expiry_date);
            return (
              <div
                key={item.id}
                className={`px-4 py-4 ${status.edge}`}
                style={{ minHeight: 56 }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      href={`/inventory/${item.id}`}
                      style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }}
                      className="truncate block hover:opacity-70 transition-opacity"
                    >
                      {item.name}
                    </Link>
                    <div style={{ fontSize: 13, color: "#8FB3CC", marginTop: 2 }}>
                      {item.category ?? "Uncategorised"}
                      {item.is_critical ? " · Critical" : ""}
                      {item.storage_location ? ` · ${item.storage_location}` : ""}
                    </div>
                    {item.component && (
                      <Link
                        href={`/components/${item.component.id}`}
                        style={{ fontSize: 13, fontWeight: 600, color: "#0B7EB8" }}
                        className="mt-0.5 inline-block hover:opacity-70 transition-opacity"
                      >
                        {item.component.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }}>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                      <Link
                        href={`/inventory/${item.id}`}
                        style={{ color: "#8FB3CC" }}
                        className="rounded-lg p-1 hover:opacity-70 transition-opacity"
                        aria-label="Edit item"
                      >
                        <Pencil size={13} />
                      </Link>
                    </div>
                    <span className={status.badgeCls}>{status.label}</span>
                    {expiryBadge && (
                      <span className={expiryBadge.cls}>{expiryBadge.label}</span>
                    )}
                  </div>
                </div>
                <StockAdjustForm boatId={boatId} inventoryItemId={item.id} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
