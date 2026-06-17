import Image from "next/image";
import { Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";
import BoatSelector from "./boat-selector";

function normalizeStatus(s: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "overdue") return "overdue";
  if (v === "due soon" || v === "due_soon") return "due_soon";
  if (v === "ok") return "ok";
  return "unknown";
}

function scorePillCls(score: number, overdueCount: number) {
  if (overdueCount > 0 || score < 50) return "bg-red-50 text-red-600 border-red-200";
  if (score < 75) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-green-50 text-green-600 border-green-200";
}

export default async function AppHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("boats")
    .select("id, name, image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const boats = (data ?? []) as { id: string; name: string; image_url: string | null }[];
  if (boats.length === 0) return null;

  const selectedId = await getSelectedBoatId();
  const activeBoat = boats.find((b) => b.id === selectedId) ?? boats[0];

  const health = await getBoatHealth(activeBoat.id);
  const knownHealth = health.filter((r) => r.risk_score != null);
  const avgRisk =
    knownHealth.length > 0
      ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
      : 0;
  const healthScore = Math.max(0, Math.round(100 - avgRisk));
  const overdueCount = health.filter((r) => normalizeStatus(r.status) === "overdue").length;

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-2">
        <Anchor size={17} className="text-ocean-600" strokeWidth={2} />
        <span className="text-sm font-semibold text-ocean-800 tracking-tight">NautIQ</span>
      </div>

      <div className="flex items-center gap-3">
        {health.length > 0 && (
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${scorePillCls(healthScore, overdueCount)}`}
            title={`Boat health score: ${healthScore}/100${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                overdueCount > 0 || healthScore < 50
                  ? "bg-red-500"
                  : healthScore < 75
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
            />
            <span>{healthScore}</span>
          </div>
        )}

        {/* Boat avatar thumbnail */}
        <div className="h-7 w-7 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center">
          {activeBoat.image_url ? (
            <Image
              src={activeBoat.image_url}
              alt={activeBoat.name}
              width={28}
              height={28}
              className="object-cover h-full w-full"
              unoptimized
            />
          ) : (
            <span className="text-sm leading-none select-none">⛵</span>
          )}
        </div>

        <BoatSelector boats={boats} selectedBoatId={activeBoat.id} />
      </div>
    </header>
  );
}
