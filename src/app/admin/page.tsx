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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const users = listData?.users ?? [];

  const { data: boatRows } = await adminClient.from("boats").select("id, user_id");

  const boatCountByUser = new Map<string, number>();
  const userByBoat = new Map<string, string>();
  for (const b of (boatRows ?? []) as { id: string; user_id: string }[]) {
    boatCountByUser.set(b.user_id, (boatCountByUser.get(b.user_id) ?? 0) + 1);
    userByBoat.set(b.id, b.user_id);
  }

  const { data: tripRows } = await adminClient.from("trips").select("boat_id");

  const tripCountByUser = new Map<string, number>();
  for (const t of (tripRows ?? []) as { boat_id: string }[]) {
    const uid = userByBoat.get(t.boat_id);
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
        <a href="/" className="text-sm text-ocean-600 hover:underline shrink-0">← Back to app</a>
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

      {/* User list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">All users</span>
          <span className="text-xs text-slate-400">{totalUsers} total</span>
        </div>

        {/* Mobile: card list */}
        <div className="sm:hidden divide-y divide-slate-100">
          {sorted.map((u) => {
            const boats = boatCountByUser.get(u.id) ?? 0;
            const trips = tripCountByUser.get(u.id) ?? 0;
            const isAdmin = ADMIN_EMAILS.includes(u.email ?? "");
            return (
              <div key={u.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <a href={`/admin/users/${u.id}`} className="font-medium text-sm text-slate-800 hover:text-ocean-600 underline-offset-2 hover:underline break-all leading-snug">
                    {u.email ?? "—"}
                  </a>
                  {isAdmin && (
                    <span className="shrink-0 text-xs font-medium text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-full px-1.5 py-0.5">Admin</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                  <span>{fmtDate(u.created_at)} · {daysSince(u.created_at)}</span>
                  <span>{boats} boat{boats !== 1 ? "s" : ""}</span>
                  <span>{trips} trip{trips !== 1 ? "s" : ""}</span>
                </div>
                {!isAdmin && (
                  <div className="mt-2">
                    <DeleteUserDialog userId={u.id} userEmail={u.email ?? ""} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Signed up</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last sign-in</th>
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
                      <a href={`/admin/users/${u.id}`} className="hover:text-ocean-600 hover:underline transition">{u.email ?? "—"}</a>
                      {isAdmin && (
                        <span className="ml-2 text-xs font-medium text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-full px-1.5 py-0.5">Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{fmtDate(u.created_at)}</div>
                      <div className="text-xs text-slate-400">{daysSince(u.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{fmtDateTime(u.last_sign_in_at ?? null)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={boats > 0 ? "font-semibold text-slate-800" : "text-slate-400"}>{boats}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={trips > 0 ? "font-semibold text-slate-800" : "text-slate-400"}>{trips}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isAdmin && <DeleteUserDialog userId={u.id} userEmail={u.email ?? ""} />}
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
