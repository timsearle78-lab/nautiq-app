import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OfflineQueueItem } from "@/lib/offline-queue";
import { parseOptionalNumber, parseRequiredNumber } from "@/lib/parse-form-data";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items: OfflineQueueItem[] = await req.json().catch(() => []);
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const item of items) {
    try {
      if (item.type === "watch-item") {
        const { boat_id, title, notes, component_id } = item.payload;
        if (!boat_id || !title) { results.push({ id: item.id, ok: false, error: "Missing fields" }); continue; }
        const { error } = await supabase.from("maintenance_watch_items").insert({
          user_id: user.id,
          boat_id: String(boat_id),
          title: String(title),
          notes: notes ? String(notes) : null,
          component_id: component_id ? String(component_id) : null,
        });
        results.push({ id: item.id, ok: !error, error: error?.message });

      } else if (item.type === "inventory-item") {
        const p = item.payload;
        const { error } = await supabase.from("inventory_items").insert({
          user_id: user.id,
          boat_id: String(p.boat_id),
          name: String(p.name),
          category: p.category ? String(p.category) : null,
          sku: p.sku ? String(p.sku) : null,
          manufacturer: p.manufacturer ? String(p.manufacturer) : null,
          quantity: parseRequiredNumber(String(p.quantity ?? 0)),
          minimum_quantity: p.minimum_quantity != null ? parseOptionalNumber(String(p.minimum_quantity)) : null,
          unit: p.unit ? String(p.unit) : null,
          storage_location: p.storage_location ? String(p.storage_location) : null,
          notes: p.notes ? String(p.notes) : null,
          expiry_date: p.expiry_date ? String(p.expiry_date) : null,
          is_critical: Boolean(p.is_critical),
          is_fuel_source: false,
          component_id: p.component_id ? String(p.component_id) : null,
        });
        results.push({ id: item.id, ok: !error, error: error?.message });

      } else if (item.type === "maintenance") {
        const p = item.payload;
        const { error } = await supabase.from("maintenance_events").insert({
          user_id: user.id,
          boat_id: String(p.boat_id),
          component_id: p.component_id ? String(p.component_id) : null,
          work_done: String(p.work_done ?? ""),
          performed_at: String(p.performed_at ?? new Date().toISOString().slice(0, 10)),
          engine_hours: p.engine_hours != null ? parseOptionalNumber(String(p.engine_hours)) : null,
          vendor: p.vendor ? String(p.vendor) : null,
          cost: p.cost != null ? parseOptionalNumber(String(p.cost)) : null,
          notes: p.notes ? String(p.notes) : null,
        });
        results.push({ id: item.id, ok: !error, error: error?.message });
      } else if (item.type === "checkin") {
        const p = item.payload;
        const { error } = await supabase.from("boat_checkins").insert({
          user_id: user.id,
          boat_id: String(p.boat_id),
          checked_at: String(p.checked_at),
          notes: p.notes ? String(p.notes) : null,
        });
        results.push({ id: item.id, ok: !error, error: error?.message });
      } else {
        results.push({ id: item.id, ok: false, error: "Unknown type" });
      }
    } catch (e) {
      results.push({ id: item.id, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ results });
}
