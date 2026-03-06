import Link from "next/link";
import { getRecentActivity } from "@/lib/inventory/queries";

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

export async function RecentActivityCard({
  boatId,
}: {
  boatId: string;
}) {
  const items = await getRecentActivity(boatId, 6);

  return (
    <section className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Recent activity</h3>
        <Link href={`/activity?boat=${boatId}`} className="text-sm underline">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">No recent activity yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-neutral-500">
                    {formatEventType(item.event_type)}
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(item.event_at).toLocaleDateString()}
                </div>
              </div>

              {item.description ? (
                <p className="mt-2 text-sm text-neutral-700 line-clamp-2">{item.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}