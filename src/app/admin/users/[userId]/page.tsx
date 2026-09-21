import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ImpersonateButton } from "@/components/admin/impersonate-button";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "trip.created":          { label: "Trip logged",            color: "bg-sky-100 text-sky-700" },
  "trip.updated":          { label: "Trip edited",            color: "bg-sky-50 text-sky-600" },
  "trip.deleted":          { label: "Trip deleted",           color: "bg-red-50 text-red-600" },
  "maintenance.logged":    { label: "Maintenance logged",     color: "bg-emerald-100 text-emerald-700" },
  "maintenance.updated":   { label: "Maintenance edited",     color: "bg-emerald-50 text-emerald-600" },
  "maintenance.deleted":   { label: "Maintenance deleted",    color: "bg-red-50 text-red-600" },
  "checkin.logged":        { label: "Boat check-in",          color: "bg-amber-100 text-amber-700" },
  "inventory.created":     { label: "Inventory item added",   color: "bg-violet-100 text-violet-700" },
  "inventory.stock_add":   { label: "Stock added",            color: "bg-violet-50 text-violet-600" },
  "inventory.stock_consume":{ label: "Stock consumed",        color: "bg-orange-50 text-orange-600" },
  "inventory.stock_correct":{ label: "Stock corrected",       color: "bg-slate-100 text-slate-600" },
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Pacific/Auckland",
  });
}

type AuditEvent = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  boat_id: string | null;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const { userId } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  const [{ data: targetUser }, { data: auditRows, error: auditError }, { data: boats }] = await Promise.all([
    adminClient.auth.admin.getUserById(userId),
    adminClient
      .from("audit_events")
      .select("id, action, entity_type, entity_id, metadata, created_at, boat_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    adminClient.from("boats").select("id, name").in(
      "id",
      // We'll resolve boat names after fetching
      [userId] // placeholder — re-fetched below
    ),
  ]);

  // Fetch boats accessible to this user (owned + member)
  const { data: userBoats } = await adminClient
    .from("boats")
    .select("id, name, user_id")
    .or(`user_id.eq.${userId},id.in.(${
      (await adminClient.from("boat_members").select("boat_id").eq("user_id", userId)).data?.map((r: { boat_id: string }) => r.boat_id).join(",") || "00000000-0000-0000-0000-000000000000"
    })`);

  const boatNameMap = new Map((userBoats ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));

  const events = (auditRows ?? []) as AuditEvent[];

  // Group events by action type for summary
  const summary = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.action] = (acc[e.action] ?? 0) + 1;
    return acc;
  }, {});

  const targetEmail = targetUser?.user?.email ?? userId;
  const createdAt = targetUser?.user?.created_at;
  const lastSignIn = targetUser?.user?.last_sign_in_at;

  return (
    <>
      <div className="flex items-center gap-2 mb-6 min-w-0">
        <a href="/admin" className="text-sm text-ocean-600 hover:underline shrink-0">← Admin</a>
        <span className="text-slate-300 shrink-0">/</span>
        <span className="text-sm text-slate-500 truncate">{targetEmail}</span>
      </div>

      {/* User header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-900 break-all leading-snug">{targetEmail}</div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono truncate">{userId}</div>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-3 sm:gap-2 shrink-0">
            <div className="text-sm text-slate-500 sm:text-right">
              {createdAt && <div>Joined {fmtDateTime(createdAt)}</div>}
              {lastSignIn && <div className="text-xs text-slate-400 mt-0.5">Last sign-in {fmtDateTime(lastSignIn)}</div>}
            </div>
            <ImpersonateButton userId={userId} userEmail={targetEmail} />
          </div>
        </div>

        {/* Boats */}
        {userBoats && userBoats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Boats</div>
            <div className="flex flex-wrap gap-2">
              {(userBoats as { id: string; name: string; user_id: string }[]).map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="font-medium text-slate-800">{b.name}</span>
                  {b.user_id !== userId && (
                    <span className="text-xs text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-full px-1.5">co-owner</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary chips */}
        {Object.keys(summary).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Activity summary</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary)
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => {
                  const meta = ACTION_LABELS[action];
                  return (
                    <span key={action} className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${meta?.color ?? "bg-slate-100 text-slate-600"}`}>
                      {meta?.label ?? action}
                      <span className="font-bold">{count}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Audit log */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">Audit log</span>
          <span className="text-xs text-slate-400">{events.length} events</span>
        </div>

        {auditError && (
          <div className="px-4 py-6 text-sm text-red-500">Failed to load audit log: {auditError.message}</div>
        )}

        {events.length === 0 && !auditError && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">No activity recorded yet.</div>
        )}

        {events.length > 0 && (
          <div className="divide-y divide-slate-100">
            {events.map((e) => {
              const meta = ACTION_LABELS[e.action];
              const boatName = e.boat_id ? boatNameMap.get(e.boat_id) : null;
              return (
                <div key={e.id} className="px-4 py-3 hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`shrink-0 inline-block text-xs font-medium rounded-full px-2.5 py-1 ${meta?.color ?? "bg-slate-100 text-slate-600"}`}>
                      {meta?.label ?? e.action}
                    </span>
                    <span className="text-xs text-slate-400 text-right whitespace-nowrap">
                      {fmtDateTime(e.created_at)}
                    </span>
                  </div>
                  {(boatName || (e.metadata && Object.keys(e.metadata).length > 0)) && (
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {boatName && <span className="text-slate-400 mr-2">{boatName}</span>}
                      {e.metadata && Object.entries(e.metadata)
                        .filter(([, v]) => v != null && v !== "")
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </div>
                  )}
                  {e.entity_id && (
                    <div className="text-xs text-slate-300 font-mono mt-0.5 truncate">{e.entity_id}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
