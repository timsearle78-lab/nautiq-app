export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/nav/app-header";
import BottomNav from "@/components/nav/bottom-nav";

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

  const { data: boats } = await supabase
    .from("boats")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!boats || boats.length === 0) redirect("/onboarding");

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="mx-auto w-full max-w-2xl">
          {children}
        </div>
      </main>
      <BottomNav userEmail={email} userInitials={initials} />
    </div>
  );
}
