import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";
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

  const { data: boats } = await supabase
    .from("boats")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!boats || boats.length === 0) redirect("/onboarding");

  const selectedBoatId = await getSelectedBoatId();
  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const [engineHoursRes, health] = await Promise.all([
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boat.id }),
    getBoatHealth(boat.id),
  ]);

  const engineHours = (engineHoursRes.data as number) ?? 0;

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
    />
  );
}
