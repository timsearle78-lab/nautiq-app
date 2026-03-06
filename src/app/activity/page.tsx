import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRecentActivity } from "@/lib/inventory/queries";

type ActivityPageProps = {
  searchParams: Promise<{ boat?: string }>;
};

function formatEventType(eventType: string) {
  switch (eventType) {
    case "trip":
      return "Trip";
    case "maintenance":
      return "Maintenance";
    case "inventory_transaction":
      return "Inventory";
    default:
      return eventType;
  }
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/activity");

  const { data: boats, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,created_at")
    .order("created_at", { ascending: true });

  if (boatsError) throw new Error(boatsError.message);
  if (!boats || boats.length === 0) redirect("/onboarding");

  const activeBoatId = selectedBoatId ?? boats[0].id;
  const activity = await getRecentActivity(activeBoatId, 50);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Activity</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Unified log of trips, maintenance, and inventory changes.
          </p>
        </div>

        <form method="get">
          <select
            name="boat"
            defaultValue={activeBoatId}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {boats.map((boat) => (
              <option key={boat.id} value={boat.id}>
                {boat.name}
              </option>
            ))}
          </select>
          <button type="submit" className="ml-2 rounded-md border px-4 py-2 text-sm">
            Go
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {activity.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-neutral-600">
            No activity yet.
          </div>
        ) : (
          activity.map((item) => (
            <article key={item.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <div className="mt-1 text-xs text-neutral-500">
                    {formatEventType(item.event_type)}
                  </div>
                </div>
                <div className="text-sm text-neutral-500">
                  {new Date(item.event_at).toLocaleString()}
                </div>
              </div>

              {item.description ? (
                <p className="mt-3 text-sm text-neutral-700">{item.description}</p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}