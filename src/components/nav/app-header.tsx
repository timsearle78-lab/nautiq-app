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
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!boats || boats.length === 0) return null;

    const selectedId = await getSelectedBoatId();
    const activeBoat = boats.find((b) => b.id === selectedId) ?? boats[0];

    return (
      <header className="h-14 shrink-0 z-30" style={{ background: "#0B2942", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="h-full mx-auto w-full max-w-[1040px]"
          style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", paddingInline: "4px" }}
        >
          <ChatMenuTrigger />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NautiqAnchorIcon size={20} color="white" />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              Naut<span style={{ color: "#FFC730" }}>IQ</span>
            </span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", textAlign: "right", paddingRight: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeBoat.name}
          </span>
        </div>
      </header>
    );
  } catch {
    return (
      <header className="h-14 shrink-0 z-30" style={{ background: "#0B2942", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="h-full mx-auto w-full max-w-[1040px]"
          style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", paddingInline: "4px" }}
        >
          <ChatMenuTrigger />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NautiqAnchorIcon size={20} color="white" />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              Naut<span style={{ color: "#FFC730" }}>IQ</span>
            </span>
          </span>
          <span />
        </div>
      </header>
    );
  }
}
