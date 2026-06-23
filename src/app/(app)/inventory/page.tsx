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
import { LowStockToggle } from "@/components/inventory/low-stock-toggle";

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
          className="mt-4 inline-block rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white transition-colors"
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

  const stockedCount = inventoryItems.length - lowStockCount - missingCriticalSpares.length;

  return (
    <main className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F2335" }}>Inventory</h1>
          <p className="mt-1" style={{ fontSize: 14, color: "#8593A0" }}>
            Track spares, consumables, and critical items on board.
          </p>
        </div>
        <AddInventorySheet boatId={activeBoatId} components={components} categories={existingCategories} />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Total */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{ background: "#F3F6F9", border: "1px solid #E2E9EF" }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: "#8593A0" }}>Total items</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#46586A", lineHeight: 1.1 }}>
            {inventoryItems.length}
          </div>
        </div>

        {/* Low stock */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{
            background: lowStockCount > 0 ? "#FDF8EA" : "#F3F6F9",
            border: `1px solid ${lowStockCount > 0 ? "#F3E6C4" : "#E2E9EF"}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: lowStockCount > 0 ? "#C8841A" : "#8593A0" }}>
            Low stock
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: lowStockCount > 0 ? "#C8841A" : "#46586A", lineHeight: 1.1 }}>
            {lowStockCount}
          </div>
        </div>

        {/* Critical missing */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{
            background: missingCriticalSpares.length > 0 ? "#FDF0F0" : "#F3F6F9",
            border: `1px solid ${missingCriticalSpares.length > 0 ? "#F8DCDC" : "#E2E9EF"}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: missingCriticalSpares.length > 0 ? "#D83A3A" : "#8593A0" }}>
            Critical missing
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: missingCriticalSpares.length > 0 ? "#D83A3A" : "#46586A", lineHeight: 1.1 }}>
            {missingCriticalSpares.length}
          </div>
        </div>

        {/* Stocked */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{
            background: stockedCount > 0 ? "#EEF8F1" : "#F3F6F9",
            border: `1px solid ${stockedCount > 0 ? "#D2EBDB" : "#E2E9EF"}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: stockedCount > 0 ? "#1D9B55" : "#8593A0" }}>
            Stocked
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: stockedCount > 0 ? "#1D9B55" : "#46586A", lineHeight: 1.1 }}>
            {stockedCount}
          </div>
        </div>
      </div>

      <LowStockToggle active={lowOnly} />

      <InventoryTable boatId={activeBoatId} items={filteredItems} />
    </main>
  );
}
