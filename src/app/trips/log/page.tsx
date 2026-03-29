import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuickLogTripForm } from "./quick-log-trip-form";

type Props = {
  searchParams?: Promise<{
    boat?: string;
  }>;
};

export default async function QuickLogTripPage({ searchParams }: Props) {
  const params = await searchParams;
  const boatId = params?.boat;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: boats } = await supabase
    .from("boats")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!boats || boats.length === 0) {
    redirect("/onboarding");
  }

  const activeBoat = boats.find((boat) => boat.id === boatId) ?? boats[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Quick Log Trip</h1>
        <p className="text-sm text-muted-foreground">
          Save a trip with engine use, fuel, and notes.
        </p>
      </div>

      <QuickLogTripForm boat={activeBoat} />
    </div>
  );
}