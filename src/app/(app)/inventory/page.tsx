import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getBoatComponents,
  getInventoryItems,
  getMissingCriticalSpares,
} from "@/lib/inventory/queries";
import { getSelectedBoatId } from "@/lib/selected-boat";

import { AddInventoryItemForm } from "@/components/inventory/add-inventory-item-form";
import { InventoryTable } from "@/components/inventory/inventory-table";

type InventoryPageProps = {
  searchParams: Promise<{ low?: string }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  noStore();

  const params = await searchParams;
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
      <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold text-slate-800">Inventory</h1>
        <p className="mt-3 text-sm text-slate-500">Create a boat first to manage inventory.</p>
        <Link
          href="/onboarding"
          className="mt-4 inline-block rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-ocean-700 transition-colors"
        >
          Go to onboarding
        </Link>
      </main>
    );
  }

  const selectedBoatId = await getSelectedBoatId();
  const activeBoatId = (selectedBoatId && boats.some(b => b.id === selectedBoatId))
    ? selectedBoatId
    : boats[0].id;

  const [inventoryItems, components, missingCriticalSpares, categoriesRes] = await Promise.all([
    getInventoryItems(activeBoatId),
    getBoatComponents(activeBoatId),
    getMissingCriticalSpares(activeBoatId),
    supabase
      .from("inventory_items")
      .select("category")
      .eq("boat_id", activeBoatId)
      .not("category", "is", null),
  ]);

  const existingCategories = [
    ...new Set(
      (categoriesRes.data ?? [])
        .map((r: { category: string | null }) => r.category)
        .filter(Boolean) as string[]
    ),
  ].sort();

  const filteredItems = lowOnly
    ? inventoryItems.filter(
        (item) =>
          item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity)
      )
    : inventoryItems;

  return (
    <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage onboard spares, consumables, and critical maintenance items.
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} />
            Low stock only
          </label>
          <button
            type="submit"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Apply
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total items</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">{inventoryItems.length}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Low stock</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">
            {
              inventoryItems.filter(
                (item) =>
                  item.minimum_quantity != null &&
                  Number(item.quantity) < Number(item.minimum_quantity)
              ).length
            }
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Missing critical spares</div>
          <div className="mt-2 text-2xl font-semibold text-red-600">{missingCriticalSpares.length}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <AddInventoryItemForm boatId={activeBoatId} components={components} categories={existingCategories} />
        <InventoryTable boatId={activeBoatId} items={filteredItems} />
      </section>
    </main>
  );
}
