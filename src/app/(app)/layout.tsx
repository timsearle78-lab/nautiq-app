export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AppHeader from "@/components/nav/app-header";
import BottomNav from "@/components/nav/bottom-nav";
import ScrollToTop from "@/components/ui/scroll-to-top";
import GlobalActionsMenu from "@/components/nav/global-actions-menu";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getUser, getUserBoats } from "@/lib/supabase/cached-queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, allBoatsData] = await Promise.all([
    getUser(),
    getUserBoats(),
  ]);

  if (!user) redirect("/login");

  const allBoats = allBoatsData as { id: string; name: string; user_id: string }[];

  // If no accessible boats at all, go to onboarding
  if (allBoats.length === 0) redirect("/onboarding");

  // "boats" for the nav switcher = only owned boats (so BottomNav/switcher still works)
  const boats = allBoats.filter((b) => b.user_id === user.id);

  const selectedBoatId = await getSelectedBoatId();
  const boatId =
    allBoats.find((b) => b.id === selectedBoatId)?.id ?? allBoats[0].id;

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean); // empty if env var not set — no fallback
  const isAdmin = adminEmails.includes(email);

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "#F4F7FA" }}>
      <ImpersonationBanner />
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-16 mx-auto w-full max-w-[1040px]">
        {children}
      </main>
      <ScrollToTop />
      <GlobalActionsMenu boatId={boatId} />
      <BottomNav userEmail={email} userInitials={initials} isAdmin={isAdmin} boats={allBoats} selectedBoatId={boatId} />
    </div>
  );
}
