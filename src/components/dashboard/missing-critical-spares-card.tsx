import Link from "next/link";
import { getMissingCriticalSpares } from "@/lib/inventory/queries";

export async function MissingCriticalSparesCard({
  boatId,
}: {
  boatId: string;
}) {
  const items = await getMissingCriticalSpares(boatId);

  return (
    <section className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Missing critical spares</h3>
        <Link href={`/inventory?boat=${boatId}&low=1`} className="text-sm underline">
          View inventory
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">No missing critical spares.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-lg border p-3">
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-neutral-500">
                {item.category ?? "Uncategorised"}
                {item.storage_location ? ` · ${item.storage_location}` : ""}
              </div>
              <div className="mt-1 text-sm text-red-700">
                Qty: {item.quantity} {item.unit ?? ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}