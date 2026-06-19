import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EditBoatForm } from "@/components/settings/edit-boat-form";
import { AddBoatForm } from "@/components/settings/add-boat-form";
import { SystemsManager } from "@/components/settings/systems-manager";
import { BoatImageUpload } from "@/components/settings/boat-image-upload";

export const dynamic = "force-dynamic";

type BoatRow = { id: string; name: string; type: string | null; image_url: string | null };
type SystemRow = { id: string; name: string; boat_id: string };

export default async function SettingsPage() {
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: boatsData, error: boatsErr } = await supabase
    .from("boats")
    .select("id,name,type,image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // image_url column may not exist yet — fall back to query without it
  let boats: BoatRow[];
  if (boatsErr) {
    const { data: fallback } = await supabase
      .from("boats")
      .select("id,name,type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    boats = ((fallback ?? []) as Omit<BoatRow, "image_url">[]).map((b) => ({ ...b, image_url: null }));
  } else {
    boats = (boatsData ?? []) as BoatRow[];
  }

  const boatIds = boats.map((b) => b.id);

  const { data: systemsData } = boatIds.length
    ? await supabase
        .from("systems")
        .select("id,name,boat_id")
        .in("boat_id", boatIds)
        .order("name", { ascending: true })
    : { data: [] };

  const systems = (systemsData ?? []) as SystemRow[];

  const systemsByBoat = new Map<string, SystemRow[]>();
  for (const s of systems) {
    if (!systemsByBoat.has(s.boat_id)) systemsByBoat.set(s.boat_id, []);
    systemsByBoat.get(s.boat_id)!.push(s);
  }

  return (
    <main className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your boats, systems, and account.</p>
      </div>

      {/* Boats */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-700">Your boats</h2>

        {boats.map((boat) => (
          <div key={boat.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">{boat.name}</span>
            </div>
            <div className="px-4 py-4 space-y-4">
              <BoatImageUpload boatId={boat.id} imageUrl={boat.image_url} />
              <EditBoatForm boatId={boat.id} name={boat.name} type={boat.type} />
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Add a new boat</span>
          </div>
          <div className="px-4 py-4">
            <AddBoatForm />
          </div>
        </div>
      </section>

      {/* Systems */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-700">Systems</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Systems group your components — e.g. Engine, Electrical, Safety.
          </p>
        </div>

        {boats.length === 0 ? (
          <p className="text-sm text-slate-500">Add a boat first to manage its systems.</p>
        ) : (
          boats.map((boat) => (
            <div key={boat.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">{boat.name}</span>
              </div>
              <div className="px-4 py-4">
                <SystemsManager
                  boatId={boat.id}
                  systems={systemsByBoat.get(boat.id) ?? []}
                />
              </div>
            </div>
          ))
        )}
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">Account</span>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </section>
    </main>
  );
}
