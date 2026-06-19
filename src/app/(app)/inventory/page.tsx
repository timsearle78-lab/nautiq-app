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

import { AddInventorySheet } from "@/components/inventory/add-inventory-sheet";
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
      <main className="px-4 py-6 space-y-5">
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

  const lowStockCount = inventoryItems.filter(
    (item) => item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity)
  ).length;

  return (
    <main className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {inventoryItems.length} items · {lowStockCount > 0 ? <span className="text-amber-600 font-medium">{lowStockCount} low stock</span> : "all stocked"}{missingCriticalSpares.length > 0 && <span className="text-red-600 font-medium"> · {missingCriticalSpares.length} critical missing</span>}
          </p>
        </div>
        <AddInventorySheet boatId={activeBoatId} components={components} categories={existingCategories} />
      </div>

      {/* Low stock filter */}
      <form method="get" className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
          Show low stock only
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Apply
        </button>
      </form>

      <InventoryTable boatId={activeBoatId} items={filteredItems} />
    </main>
  );
}
