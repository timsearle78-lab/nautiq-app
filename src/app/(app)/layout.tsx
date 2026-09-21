export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/nav/app-header";
import BottomNav from "@/components/nav/bottom-nav";
import ScrollToTop from "@/components/ui/scroll-to-top";
import GlobalActionsMenu from "@/components/nav/global-actions-menu";
import { getSelectedBoatId } from "@/lib/selected-boat";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boatsData } = await supabase
    .from("boats")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const boats = boatsData ?? [];

  if (boats.length === 0) {
    // Before sending to onboarding, check if this user is a member of any shared boat
    const { data: memberBoats } = await supabase
      .from("boat_members")
      .select("boat_id")
      .eq("user_id", user.id)
      .limit(1);
    if (!memberBoats || memberBoats.length === 0) redirect("/onboarding");
  }

  const selectedBoatId = await getSelectedBoatId();

  // Fall back to member boats if the user owns none
  let boatId = boats.find((b) => b.id === selectedBoatId)?.id ?? boats[0]?.id;
  if (!boatId) {
    const { data: allAccessible } = await supabase
      .from("boats")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);
    boatId = allAccessible?.[0]?.id ?? "";
  }

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean); // empty if env var not set — no fallback
  const isAdmin = adminEmails.includes(email);

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "#F4F7FA" }}>
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-16 mx-auto w-full max-w-[1040px]">
        {children}
      </main>
      <ScrollToTop />
      <GlobalActionsMenu boatId={boatId} />
      <BottomNav userEmail={email} userInitials={initials} isAdmin={isAdmin} boats={boats} selectedBoatId={boatId} />
    </div>
  );
}
