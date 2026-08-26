import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import ChatMenuTrigger from "./chat-menu-trigger";

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
      <header
        className="h-14 shrink-0 relative flex items-center justify-between px-4 z-30"
        style={{ background: "#0B2942", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <ChatMenuTrigger />
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{activeBoat.name}</span>
      </header>
    );
  } catch {
    return (
      <header
        className="h-14 shrink-0 relative flex items-center px-4 z-30"
        style={{ background: "#0B2942", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <ChatMenuTrigger />
      </header>
    );
  }
}
