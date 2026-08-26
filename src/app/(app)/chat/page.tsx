import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";
import { getMissingComponents } from "@/lib/component-suggestions";
import { getPendingDrafts } from "@/lib/maintenance-drafts";
import { getPendingTripDrafts } from "@/lib/trip-drafts";
import ChatInterface from "@/components/chat/chat-interface";

export const dynamic = "force-dynamic";

function normalizeStatus(s: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "overdue") return "overdue";
  if (v === "due soon" || v === "due_soon") return "due_soon";
  if (v === "ok") return "ok";
  return "unknown";
}

export default async function ChatPage() {
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: boats, error: boatsErr }, selectedBoatId] = await Promise.all([
    supabase
      .from("boats")
      .select("id, name, type, propulsion, hull_design, hull_material")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    getSelectedBoatId(),
  ]);

  // Fall back to base columns if new spec columns don't exist yet in DB
  const boatList = boatsErr
    ? ((await supabase.from("boats").select("id, name, type").eq("user_id", user.id).order("created_at", { ascending: true })).data ?? [])
    : (boats ?? []);
  const boat = boatList.find((b) => b.id === selectedBoatId) ?? boatList[0];

  if (!boat) redirect("/onboarding");

  const [engineHoursRes, health, componentsRes, inventoryRes, tripsCountRes, pendingDrafts, pendingTripDrafts, userSettingsRes] = await Promise.all([
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boat.id }),
    getBoatHealth(boat.id),
    supabase.from("components").select("id, name").eq("boat_id", boat.id).order("name"),
    supabase.from("inventory_items").select("id, name, quantity, unit, minimum_quantity, is_critical").eq("boat_id", boat.id).order("name"),
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("boat_id", boat.id),
    getPendingDrafts(),
    getPendingTripDrafts(),
    supabase.from("user_settings").select("hide_greeting, hide_whats_new").eq("user_id", user.id).single(),
  ]);

  const components = (componentsRes.data ?? []) as { id: string; name: string }[];
  const boatWithSpecs = boat as { id: string; name: string; type?: string | null; propulsion?: string | null; hull_material?: string | null };
  const missingSuggestions = getMissingComponents(
    { type: boatWithSpecs.type ?? null, propulsion: boatWithSpecs.propulsion ?? null, hull_material: boatWithSpecs.hull_material ?? null },
    components.map((c) => c.name)
  );
  const inventoryItems = (inventoryRes.data ?? []) as { id: string; name: string; quantity: number; unit: string | null; minimum_quantity: number | null; is_critical: boolean }[];
  const hasTrips = (tripsCountRes.count ?? 0) > 0;
  const hasInventory = inventoryItems.length > 0;

  const engineHours = (engineHoursRes.data as number) ?? 0;
  const userSettings = userSettingsRes.data as { hide_greeting: boolean; hide_whats_new: boolean } | null;
  const hideGreeting = userSettings?.hide_greeting ?? false;
  const hideWhatsNew = userSettings?.hide_whats_new ?? false;

  const knownHealth = health.filter((r) => r.risk_score != null);
  const avgRisk = knownHealth.length > 0
    ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
    : 0;
  const healthScore = Math.max(0, Math.round(100 - avgRisk));

  const overdueCount = health.filter((r) => normalizeStatus(r.status) === "overdue").length;
  const dueSoonCount = health.filter((r) => normalizeStatus(r.status) === "due_soon").length;
  const okCount = health.filter((r) => normalizeStatus(r.status) === "ok").length;

  // Build urgent list from getBoatHealth() so it uses the same accurate data
  // as the rest of the page, not the stale timeline RPC.
  const urgent = health
    .filter((r) => normalizeStatus(r.status) === "overdue" || normalizeStatus(r.status) === "due_soon")
    .map((r) => ({ component_id: r.component_id, component_name: r.component_name, system_name: r.system_name, predicted_due_date: null, status: normalizeStatus(r.status) as "overdue" | "due_soon" }));

  return (
    <ChatInterface
      boat={boat}
      engineHours={engineHours}
      healthScore={healthScore}
      overdueCount={overdueCount}
      dueSoonCount={dueSoonCount}
      okCount={okCount}
      urgentItems={urgent}
      components={components}
      inventoryItems={inventoryItems}
      missingSuggestions={missingSuggestions}
      pendingDrafts={pendingDrafts}
      pendingTripDrafts={pendingTripDrafts}
      hideGreeting={hideGreeting}
      hideWhatsNew={hideWhatsNew}
      hasTrips={hasTrips}
      hasInventory={hasInventory}
    />
  );
}
