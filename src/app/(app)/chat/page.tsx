import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatInterface from "@/components/chat/chat-interface";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boats } = await supabase
    .from("boats")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!boats || boats.length === 0) redirect("/onboarding");

  const defaultBoat = boats[0];

  const { data: engineHoursData } = await supabase.rpc("get_boat_engine_hours", {
    p_boat_id: defaultBoat.id,
  });

  return (
    <ChatInterface
      boat={defaultBoat}
      engineHours={(engineHoursData as number) ?? 0}
    />
  );
}
