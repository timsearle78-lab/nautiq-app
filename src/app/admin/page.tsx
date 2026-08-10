import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";


export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
  });
}

function daysSince(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default async function AdminPage() {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/");
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all auth users (up to 1000)
  const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

  // Fetch boat counts per user
  const { data: boatRows } = await adminClient
    .from("boats")
    .select("user_id");

  // Fetch trip counts per boat owner (via boats join)
  const { data: tripRows } = await adminClient
    .from("trips")
    .select("boat_id, boats!inner(user_id)");

  const boatCountByUser = new Map<string, number>();
  for (const b of boatRows ?? []) {
    boatCountByUser.set(b.user_id, (boatCountByUser.get(b.user_id) ?? 0) + 1);
  }

  const tripCountByUser = new Map<string, number>();
  for (const t of (tripRows ?? []) as unknown as { boat_id: string; boats: { user_id: string } }[]) {
    const uid = t.boats?.user_id;
    if (uid) tripCountByUser.set(uid, (tripCountByUser.get(uid) ?? 0) + 1);
  }

  const sorted = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalUsers = users.length;
  const last7 = users.filter(
    (u) => Date.now() - new Date(u.created_at).getTime() < 7 * 86400000
  ).length;
  const last30 = users.filter(
    (u) => Date.now() - new Date(u.created_at).getTime() < 30 * 86400000
  ).length;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-500 mt-0.5">NautIQ user overview</p>
        </div>
        <a
          href="/"
          className="text-sm text-ocean-600 hover:underline"
        >
          ← Back to app
        </a>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total users", value: totalUsers },
          { label: "Last 7 days", value: last7 },
          { label: "Last 30 days", value: last30 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* User table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">All users</span>
          <span className="text-xs text-slate-400">{totalUsers} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Signed up</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last sign-in</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Boats</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trips</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((u) => {
                const boats = boatCountByUser.get(u.id) ?? 0;
                const trips = tripCountByUser.get(u.id) ?? 0;
                const isAdmin = ADMIN_EMAILS.includes(u.email ?? "");
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <span>{u.email ?? "—"}</span>
                      {isAdmin && (
                        <span className="ml-2 text-xs font-medium text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-full px-1.5 py-0.5">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{fmtDate(u.created_at)}</div>
                      <div className="text-xs text-slate-400">{daysSince(u.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {fmtDateTime(u.last_sign_in_at ?? null)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={boats > 0 ? "font-semibold text-slate-800" : "text-slate-400"}>{boats}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={trips > 0 ? "font-semibold text-slate-800" : "text-slate-400"}>{trips}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isAdmin && (
                        <DeleteUserDialog
                          userId={u.id}
                          userEmail={u.email ?? ""}
                          onDeleted={() => window.location.reload()}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
