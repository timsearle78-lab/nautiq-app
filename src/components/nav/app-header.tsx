import { Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import BoatSelector from "./boat-selector";

export default async function AppHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("boats")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const boats = (data ?? []) as { id: string; name: string }[];
  if (boats.length === 0) return null;

  const selectedId = await getSelectedBoatId();
  const activeBout = boats.find((b) => b.id === selectedId) ?? boats[0];

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-2">
        <Anchor size={17} className="text-ocean-600" strokeWidth={2} />
        <span className="text-sm font-semibold text-ocean-800 tracking-tight">NautIQ</span>
      </div>
      <BoatSelector boats={boats} selectedBoatId={activeBout.id} />
    </header>
  );
}
