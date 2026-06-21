import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";
import BoatSelector from "./boat-selector";
import NautiqLogo from "@/components/ui/nautiq-logo";

function normalizeStatus(s: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "overdue") return "overdue";
  if (v === "due soon" || v === "due_soon") return "due_soon";
  if (v === "ok") return "ok";
  return "unknown";
}

function scorePillStyle(score: number, overdueCount: number): React.CSSProperties {
  if (overdueCount > 0 || score < 60) return { color: "#D83A3A", background: "#FDEBEB", border: "1px solid #F3C4C4" };
  if (score < 80) return { color: "#C8841A", background: "#FBF2DC", border: "1px solid #ECD6A6" };
  return { color: "#1D9B55", background: "#E7F6EE", border: "1px solid #B8E2C8" };
}

export default async function AppHeader() {
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error: boatErr } = await supabase
    .from("boats")
    .select("id, name, image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  let rawBoats = data ?? [];
  if (boatErr) {
    const { data: fallback } = await supabase
      .from("boats")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    rawBoats = (fallback ?? []).map((b) => ({ ...b, image_url: null }));
  }

  const boats = rawBoats as { id: string; name: string; image_url: string | null }[];
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
    <header
      className="h-14 shrink-0 flex items-center justify-between px-4 z-30"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E6EBF0" }}
    >
      <NautiqLogo size={20} />

      <div className="flex items-center gap-3">
        {health.length > 0 && (
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={scorePillStyle(healthScore, overdueCount)}
            title={`Boat health score: ${healthScore}/100${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: scorePillStyle(healthScore, overdueCount).color }}
            />
            <span>{healthScore}</span>
          </div>
        )}

        <div
          className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ border: "1px solid #E6EBF0", background: "#EEF1F5" }}
        >
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
  } catch {
    return (
      <header
        className="h-14 shrink-0 flex items-center px-4 z-30"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #E6EBF0" }}
      >
        <NautiqLogo size={20} />
      </header>
    );
  }
}
