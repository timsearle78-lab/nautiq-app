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
import { InventoryStatTiles } from "@/components/inventory/inventory-stat-tiles";

type InventoryPageProps = {
  searchParams: Promise<{ status?: string; component?: string }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  noStore();

  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const componentFilter = params.component ?? "";

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

  const today2 = new Date(); today2.setHours(0, 0, 0, 0);
  const in90Days2 = new Date(today2); in90Days2.setDate(in90Days2.getDate() + 90);

  const filteredItems = inventoryItems.filter((item) => {
    if (componentFilter && item.component_id !== componentFilter) return false;
    if (statusFilter) {
      const isMissing = item.is_critical && Number(item.quantity) <= 0;
      const isLow = !isMissing && item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity);
      const isExpiring = !!item.expiry_date && (() => {
        const exp = new Date(item.expiry_date!); exp.setHours(0, 0, 0, 0);
        return exp <= in90Days2;
      })();
      const isCriticalLow = item.is_critical && item.minimum_quantity != null && Number(item.quantity) <= Number(item.minimum_quantity);
      if (statusFilter === "missing" && !isMissing) return false;
      if (statusFilter === "low" && !isLow) return false;
      if (statusFilter === "critical" && !isCriticalLow) return false;
      if (statusFilter === "expiring" && !isExpiring) return false;
      if (statusFilter === "ok" && (isMissing || isLow)) return false;
    }
    return true;
  });

  const lowStockCount = inventoryItems.filter((item) => {
    const isMissing = item.is_critical && Number(item.quantity) <= 0;
    return !isMissing && item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity);
  }).length;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in90Days = new Date(today); in90Days.setDate(in90Days.getDate() + 90);
  const expiringSoonCount = inventoryItems.filter((item) => {
    if (!item.expiry_date) return false;
    const expiry = new Date(item.expiry_date); expiry.setHours(0, 0, 0, 0);
    return expiry <= in90Days;
  }).length;

  const stockedCount = inventoryItems.length - lowStockCount - missingCriticalSpares.length;

  return (
    <main className="space-y-4">
      {/* Navy page hero */}
      <div className="w-full px-4 pt-5 pb-5" style={{ background: "#0B2942" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>Inventory</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              Spares, consumables, and critical items on board.
            </p>
          </div>
          <div className="flex-shrink-0">
            <AddInventorySheet boatId={activeBoatId} components={components} categories={existingCategories} />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <InventoryStatTiles
          totalCount={inventoryItems.length}
          lowStockCount={lowStockCount}
          missingCount={missingCriticalSpares.length}
          stockedCount={stockedCount}
          expiringSoonCount={expiringSoonCount}
          activeStatus={statusFilter}
          componentId={componentFilter}
          components={components}
        />

        <InventoryTable boatId={activeBoatId} items={filteredItems} />
      </div>
    </main>
  );
}
