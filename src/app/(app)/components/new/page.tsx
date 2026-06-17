import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AddComponentForm } from "@/components/components/add-component-form";

export const dynamic = "force-dynamic";

type NewComponentPageProps = {
  searchParams: Promise<{ boat?: string }>;
};

type BoatRow = { id: string; name: string; type: string | null; created_at: string };
type SystemRow = { id: string; name: string };

export default async function NewComponentPage({ searchParams }: NewComponentPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/components/new");

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: false });

  if (boatsError) throw new Error(`Failed to load boats: ${boatsError.message}`);

  const boats = (boatsData ?? []) as BoatRow[];
  if (boats.length === 0) redirect("/onboarding");

  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const { data: systemsData, error: systemsError } = await supabase
    .from("systems")
    .select("id,name")
    .eq("boat_id", boat.id)
    .order("name", { ascending: true });

  if (systemsError) throw new Error(`Failed to load systems: ${systemsError.message}`);

  const systems = (systemsData ?? []) as SystemRow[];

  return (
    <main className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">New Component</h1>
        <p className="mt-1 text-sm text-slate-500">Adding to {boat.name}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <AddComponentForm boatId={boat.id} systems={systems} />
      </div>
    </main>
  );
}
