import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import ChatInterface from "@/components/chat/chat-interface";

export const dynamic = "force-dynamic";

type HealthRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  risk_score: number | null;
  status: string | null;
};
type TimelineRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  predicted_due_date: string | null;
  status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
};

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

  const [engineHoursRes, healthRes, timelineRes] = await Promise.all([
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boat.id }),
    supabase.rpc("get_boat_health", { p_boat_id: boat.id }),
    supabase.rpc("get_boat_maintenance_timeline", { p_boat_id: boat.id, p_horizon_days: 90 }),
  ]);

  const engineHours = (engineHoursRes.data as number) ?? 0;
  const health = (healthRes.data ?? []) as HealthRow[];
  const timeline = (timelineRes.data ?? []) as TimelineRow[];

  const avgRisk = health.length > 0
    ? health.reduce((s, c) => s + (c.risk_score ?? 0), 0) / health.length
    : 0;
  const healthScore = Math.max(0, Math.round(100 - avgRisk));

  const overdueCount = health.filter((r) => normalizeStatus(r.status) === "overdue").length;
  const dueSoonCount = health.filter((r) => normalizeStatus(r.status) === "due_soon").length;
  const okCount = health.filter((r) => normalizeStatus(r.status) === "ok").length;

  const urgent = timeline.filter((r) => r.status === "overdue" || r.status === "due_soon");

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
