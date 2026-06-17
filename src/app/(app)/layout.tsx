export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <BottomNav userEmail={email} userInitials={initials} />
    </div>
  );
}
