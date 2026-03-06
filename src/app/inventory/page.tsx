import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getBoatComponents,
  getInventoryItems,
  getMissingCriticalSpares,
} from "@/lib/inventory/queries";

import { AddInventoryItemForm } from "@/components/inventory/add-inventory-item-form";
import { InventoryTable } from "@/components/inventory/inventory-table";

type InventoryPageProps = {
  searchParams: Promise<{ boat?: string; low?: string }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;
  const lowOnly = params.low === "1";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/inventory");

  const { data: boats, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: true });

  if (boatsError) {
    throw new Error(`Failed to load boats: ${boatsError.message}`);
  }

  if (!boats || boats.length === 0) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="mt-3 text-sm text-neutral-600">Create a boat first to manage inventory.</p>
        <Link href="/onboarding" className="mt-4 inline-block rounded-md border px-4 py-2">
          Go to onboarding
        </Link>
      </main>
    );
  }

  const activeBoatId = selectedBoatId ?? boats[0].id;

  const [inventoryItems, components, missingCriticalSpares] = await Promise.all([
    getInventoryItems(activeBoatId),
    getBoatComponents(activeBoatId),
    getMissingCriticalSpares(activeBoatId),
  ]);

  const filteredItems = lowOnly
    ? inventoryItems.filter(
        (item) =>
          item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity)
      )
    : inventoryItems;

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage onboard spares, consumables, and critical maintenance items.
          </p>
        </div>

        <form method="get" className="flex flex-wrap gap-3">
          <select
            name="boat"
            defaultValue={activeBoatId}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {boats.map((boat) => (
              <option key={boat.id} value={boat.id}>
                {boat.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} />
            Low stock only
          </label>

          <button type="submit" className="rounded-md border px-4 py-2 text-sm">
            Apply
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Total items</div>
          <div className="mt-2 text-2xl font-semibold">{inventoryItems.length}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Low stock</div>
          <div className="mt-2 text-2xl font-semibold">
            {
              inventoryItems.filter(
                (item) =>
                  item.minimum_quantity != null &&
                  Number(item.quantity) < Number(item.minimum_quantity)
              ).length
            }
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Missing critical spares</div>
          <div className="mt-2 text-2xl font-semibold">{missingCriticalSpares.length}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <AddInventoryItemForm boatId={activeBoatId} components={components} />
        <InventoryTable boatId={activeBoatId} items={filteredItems} />
      </section>
    </main>
  );
}