import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EditInventoryItemForm } from "@/components/inventory/edit-inventory-item-form";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

type ComponentOption = { id: string; name: string };

export default async function EditInventoryItemPage({ params }: PageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: itemData } = await supabase
    .from("inventory_items")
    .select("id, user_id, boat_id, component_id, name, category, sku, manufacturer, quantity, minimum_quantity, unit, storage_location, notes, is_critical")
    .eq("id", id)
    .single();

  if (!itemData || itemData.user_id !== user.id) notFound();

  const [componentsRes, categoriesRes] = await Promise.all([
    supabase.from("components").select("id, name").eq("boat_id", itemData.boat_id).order("name"),
    supabase.from("inventory_items").select("category").eq("boat_id", itemData.boat_id).not("category", "is", null),
  ]);

  const components = (componentsRes.data ?? []) as ComponentOption[];
  const existingCategories = [
    ...new Set(
      (categoriesRes.data ?? [])
        .map((r: { category: string | null }) => r.category)
        .filter(Boolean) as string[]
    ),
  ].sort();

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
    </main>
  );
}
