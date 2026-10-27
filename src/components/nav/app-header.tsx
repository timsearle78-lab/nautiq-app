import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import ChatMenuTrigger from "./chat-menu-trigger";
import NautiqAnchorIcon from "@/components/ui/nautiq-anchor-icon";

export default async function AppHeader() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: boats } = await supabase
      .from("boats")
      .select("id, name")
      .order("created_at", { ascending: true });

    if (!boats || boats.length === 0) return null;

    const selectedId = await getSelectedBoatId();
    const activeBoat = boats.find((b) => b.id === selectedId) ?? boats[0];

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const isTrialing = sub?.plan === "trialing" && sub?.trial_ends_at;
    const trialDaysLeft = isTrialing
      ? Math.ceil((new Date(sub!.trial_ends_at!).getTime() - Date.now()) / 86400000)
      : null;

    return (
      <header className="h-14 shrink-0 z-30" style={{ background: "var(--color-navy-700)" }}>
        <div
          className="h-full mx-auto w-full max-w-[1040px]"
          style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", paddingInline: "4px" }}
        >
          <ChatMenuTrigger />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NautiqAnchorIcon size={20} color="white" />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              Naut<span style={{ color: "var(--color-amber-400)" }}>IQ</span>
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingRight: 16, overflow: "hidden" }}>
            {trialDaysLeft !== null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: trialDaysLeft <= 7 ? "var(--color-amber-400)" : "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.1)", borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
                Trial · {trialDaysLeft <= 0 ? "ends today" : `${trialDaysLeft}d left`}
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeBoat.name}
            </span>
          </span>
        </div>
      </header>
    );
  } catch {
    return (
      <header className="h-14 shrink-0 z-30" style={{ background: "var(--color-navy-700)" }}>
        <div
          className="h-full mx-auto w-full max-w-[1040px]"
          style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", paddingInline: "4px" }}
        >
          <ChatMenuTrigger />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NautiqAnchorIcon size={20} color="white" />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              Naut<span style={{ color: "var(--color-amber-400)" }}>IQ</span>
            </span>
          </span>
          <span />
        </div>
      </header>
    );
  }
}
