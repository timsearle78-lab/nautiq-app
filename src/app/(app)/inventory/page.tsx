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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inventory");

  const { data: boats, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: true });

  if (boatsError) throw new Error(`Failed to load boats: ${boatsError.message}`);

  if (!boats || boats.length === 0) {
    return (
      <main className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-slate-800">Inventory</h1>
        <p className="text-sm text-slate-500">Create a boat first to manage inventory.</p>
        <Link
          href="/onboarding"
          className="inline-flex rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-ocean-700 transition-colors"
        >
          Set up your boat
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

  const lowStockCount = inventoryItems.filter(
    (item) => item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity)
  ).length;

  return (
    <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Onboard spares, consumables, and critical items.
          </p>
        </div>

        {boats.length > 1 && (
          <form method="get" className="flex gap-2 items-center">
            <select
              name="boat"
              defaultValue={activeBoatId}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
            >
              {boats.map((boat) => (
                <option key={boat.id} value={boat.id}>{boat.name}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Switch
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total items</div>
          <div className="mt-1.5 text-2xl font-semibold text-slate-800">{inventoryItems.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Low stock</div>
          <div className={`mt-1.5 text-2xl font-semibold ${lowStockCount > 0 ? "text-amber-600" : "text-slate-800"}`}>
            {lowStockCount}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Missing critical</div>
          <div className={`mt-1.5 text-2xl font-semibold ${missingCriticalSpares.length > 0 ? "text-red-600" : "text-slate-800"}`}>
            {missingCriticalSpares.length}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/inventory?boat=${activeBoatId}`}
          className={!lowOnly
            ? "rounded-full bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white"
            : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"}
        >
          All
        </Link>
        <Link
          href={`/inventory?boat=${activeBoatId}&low=1`}
          className={lowOnly
            ? "rounded-full bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white"
            : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"}
        >
          Low stock
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_2fr]">
        <AddInventoryItemForm boatId={activeBoatId} components={components} />
        <InventoryTable boatId={activeBoatId} items={filteredItems} />
      </div>
    </main>
  );
}
