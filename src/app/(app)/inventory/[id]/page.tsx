import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EditInventoryItemForm } from "@/components/inventory/edit-inventory-item-form";
import { SortableTh, sortHref } from "@/components/ui/sortable-th";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ sort?: string; dir?: string }> };

type ComponentOption = { id: string; name: string };

export default async function EditInventoryItemPage({ params, searchParams }: PageProps) {
  noStore();

  const { id } = await params;
  const sp = await searchParams;
  const sort = sp.sort ?? null;
  const dir = (sp.dir === "asc" || sp.dir === "desc" ? sp.dir : null) as "asc" | "desc" | null;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: itemData } = await supabase
    .from("inventory_items")
    .select("id, user_id, boat_id, component_id, name, category, sku, manufacturer, quantity, minimum_quantity, unit, storage_location, notes, is_critical, is_fuel_source, expiry_date, photo_urls")
    .eq("id", id)
    .single();

  if (!itemData) notFound();
  if (itemData.user_id !== user.id) {
    // Check if co-owner
    const { data: membership } = await supabase
      .from("boat_members")
      .select("id")
      .eq("boat_id", itemData.boat_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) notFound();
  }

  const [componentsRes, categoriesRes, txRes] = await Promise.all([
    supabase.from("components").select("id, name").eq("boat_id", itemData.boat_id).order("name"),
    supabase.from("inventory_items").select("category").eq("boat_id", itemData.boat_id).not("category", "is", null),
    supabase
      .from("inventory_transactions")
      .select("id, transaction_type, quantity_delta, cost, notes, created_at")
      .eq("inventory_item_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const components = (componentsRes.data ?? []) as ComponentOption[];
  const existingCategories = [
    ...new Set(
      (categoriesRes.data ?? [])
        .map((r: { category: string | null }) => r.category)
        .filter(Boolean) as string[]
    ),
  ].sort();

  type TxRow = { id: string; transaction_type: string; quantity_delta: number; cost: number | null; notes: string | null; created_at: string };
  const transactions = (txRes.data ?? []) as TxRow[];

  const sortedTx: TxRow[] = sort ? [...transactions].sort((a, b) => {
    const mul = dir === "desc" ? -1 : 1;
    switch (sort) {
      case "date": return mul * a.created_at.localeCompare(b.created_at);
      case "type": return mul * a.transaction_type.localeCompare(b.transaction_type);
      case "qty": return mul * (a.quantity_delta - b.quantity_delta);
      case "cost": return mul * (Number(a.cost ?? 0) - Number(b.cost ?? 0));
      default: return 0;
    }
  }) : transactions;

  return (
    <main className="px-4 py-6 space-y-5">
      <div>
        <Link href={`/inventory?boat=${itemData.boat_id}`} className="text-sm text-slate-500 hover:text-ocean-600">
          ← Back to inventory
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Edit item</h1>
        <p className="mt-1 text-sm text-slate-500">{itemData.name}</p>
      </div>

      <EditInventoryItemForm item={itemData} components={components} categories={existingCategories} />

      {/* Transaction history */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Inventory history</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400">No transactions recorded yet.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {(["date","type","qty","cost"] as const).map((col) => {
                    const clsMap: Record<string, string> = {
                      date: "text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide",
                      type: "text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide",
                      qty: "text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide",
                      cost: "text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell",
                    };
                    return <SortableTh key={col} href={sortHref(`/inventory/${id}`, {}, col, sort, dir)} label={col.charAt(0).toUpperCase()+col.slice(1)} active={sort===col} dir={sort===col?dir:null} className={clsMap[col]} />;
                  })}
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTx.map((tx) => {
                  const isAdd = tx.quantity_delta > 0;
                  const date = new Date(tx.created_at).toLocaleDateString("en-NZ", {
                    day: "numeric", month: "short", year: "numeric",
                  });
                  return (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                          isAdd
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          {isAdd ? "+" : "−"} {isAdd ? "Added" : "Used"}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${isAdd ? "text-green-700" : "text-red-600"}`}>
                        {isAdd ? "+" : ""}{tx.quantity_delta} {itemData.unit ?? ""}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 hidden sm:table-cell">
                        {isAdd && tx.cost != null ? `$${Number(tx.cost).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{tx.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
