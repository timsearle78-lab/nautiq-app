import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "NautIQ <notifications@nautiq.app>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://nautiq.app";

// ---------------------------------------------------------------------------
// Health scoring — mirrors src/lib/components/health.ts
// ---------------------------------------------------------------------------

function daysBetween(fromIso: string, toDate = new Date()) {
  const from = new Date(fromIso);
  return Math.max(0, Math.floor((toDate.getTime() - from.getTime()) / 86_400_000));
}

function totalIntervalDays(years: number | null, months: number | null, days: number | null): number | null {
  const total = (years ?? 0) * 365 + (months ?? 0) * 30 + (days ?? 0);
  return total > 0 ? total : null;
}

type ComponentStatus = "overdue" | "due_soon" | "ok" | "unknown";

interface ComponentHealth {
  componentId: string;
  componentName: string;
  systemName: string | null;
  status: ComponentStatus;
  daysSinceService: number | null;
  hoursSinceService: number | null;
  predictedDueDate: string | null;
}

function computeComponentHealth(
  component: Record<string, unknown>,
  latestEvent: { performed_at: string | null; engine_hours_at_service: number | null } | null,
  trips: { started_at: string | null; engine_hours_delta: number }[],
): ComponentHealth {
  const systemArr = component.system as { name: string }[] | { name: string } | null;
  const system = Array.isArray(systemArr) ? systemArr[0] : systemArr;

  const lastServiceDate = latestEvent?.performed_at ?? (component.install_date as string | null) ?? null;
  const daysSinceService = lastServiceDate ? daysBetween(lastServiceDate) : null;

  const serviceDay = lastServiceDate?.slice(0, 10) ?? null;
  const hoursSinceService = serviceDay != null
    ? trips
        .filter((t) => t.started_at != null && t.started_at.slice(0, 10) > serviceDay)
        .reduce((sum, t) => sum + (t.engine_hours_delta ?? 0), 0)
    : null;

  const dayInterval = totalIntervalDays(
    (component.service_interval_years as number | null) ?? null,
    (component.service_interval_months as number | null) ?? null,
    (component.service_interval_days as number | null) ?? null,
  );
  const hourInterval = (component.service_interval_engine_hours as number | null) ?? null;

  let dayRatio: number | null = null;
  let hourRatio: number | null = null;
  if (dayInterval && dayInterval > 0 && daysSinceService != null) dayRatio = daysSinceService / dayInterval;
  if (hourInterval && hourInterval > 0 && hoursSinceService != null) hourRatio = hoursSinceService / hourInterval;

  const maxRatio = Math.max(dayRatio ?? 0, hourRatio ?? 0);

  let status: ComponentStatus;
  if (!lastServiceDate) {
    status = "unknown";
  } else if (maxRatio >= 1) {
    status = "overdue";
  } else if (maxRatio >= 0.85) {
    status = "due_soon";
  } else {
    status = "ok";
  }

  let predictedDueDate: string | null = null;
  if (lastServiceDate && dayInterval && dayInterval > 0) {
    const due = new Date(lastServiceDate);
    due.setDate(due.getDate() + dayInterval);
    predictedDueDate = due.toISOString().slice(0, 10);
  }

  return {
    componentId: component.id as string,
    componentName: component.name as string,
    systemName: system?.name ?? null,
    status,
    daysSinceService,
    hoursSinceService,
    predictedDueDate,
  };
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

function scoreColor(score: number) {
  if (score >= 80) return "#1D9B55";
  if (score >= 60) return "#C8841A";
  return "#D83A3A";
}

function buildHealthSummaryEmail(boatName: string, score: number, overdue: ComponentHealth[], dueSoon: ComponentHealth[], inventoryIssues: InventoryIssue[]) {
  const color = scoreColor(score);
  const totalIssues = overdue.length + dueSoon.length + inventoryIssues.length;

  const overdueRows = overdue.map((c) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;">
        <strong style="color:#111827;font-size:14px;">${c.componentName}</strong>
        ${c.systemName ? `<br><span style="color:#9CA3AF;font-size:12px;">${c.systemName}</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;text-align:right;">
        <span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:99px;padding:2px 8px;font-size:12px;font-weight:600;white-space:nowrap;">Overdue</span>
      </td>
    </tr>`).join("");

  const dueSoonRows = dueSoon.map((c) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;">
        <strong style="color:#111827;font-size:14px;">${c.componentName}</strong>
        ${c.systemName ? `<br><span style="color:#9CA3AF;font-size:12px;">${c.systemName}</span>` : ""}
        ${c.predictedDueDate ? `<br><span style="color:#D97706;font-size:12px;">Due ${formatDate(c.predictedDueDate)}</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;text-align:right;">
        <span style="background:#FFFBEB;color:#D97706;border:1px solid #FDE68A;border-radius:99px;padding:2px 8px;font-size:12px;font-weight:600;white-space:nowrap;">Due soon</span>
      </td>
    </tr>`).join("");

  const inventoryRows = inventoryIssues.slice(0, 5).map((i) => {
    const badgeBg = (i.issue === "expired" || i.issue === "out_of_stock") ? "#FEF2F2" : "#FFFBEB";
    const badgeColor = (i.issue === "expired" || i.issue === "out_of_stock") ? "#DC2626" : "#D97706";
    const badgeBorder = (i.issue === "expired" || i.issue === "out_of_stock") ? "#FECACA" : "#FDE68A";
    const badgeLabel = i.issue === "expired" ? "Expired" : i.issue === "out_of_stock" ? "Out of stock" : i.issue === "expiring_soon" ? "Expiring soon" : "Low stock";
    return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;">
        <strong style="color:#111827;font-size:14px;">${i.name}</strong>
        ${i.is_critical ? `<br><span style="color:#9CA3AF;font-size:12px;">Critical spare</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;text-align:right;">
        <span style="background:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};border-radius:99px;padding:2px 8px;font-size:12px;font-weight:600;white-space:nowrap;">${badgeLabel}</span>
      </td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0B2942;padding:24px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="#5EC6EE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="50" cy="18" r="9"/>
                <line x1="50" y1="27" x2="50" y2="84"/>
                <line x1="26" y1="43" x2="74" y2="43"/>
                <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56"/>
              </svg>
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;"><span style="color:#FFFFFF;">Naut</span><span style="color:#5EC6EE;">IQ</span></span>
            </td>
          </tr></table>
          <p style="color:#5EC6EE;font-size:13px;margin:6px 0 0;opacity:0.85;">${boatName} — Boat Health Summary</p>
        </td></tr>

        <!-- Score -->
        <tr><td style="padding:28px 28px 20px;text-align:center;">
          <div style="display:inline-block;background:#F9FAFB;border:2px solid ${color};border-radius:99px;padding:12px 28px;">
            <span style="color:${color};font-size:40px;font-weight:800;">${score}</span>
            <span style="color:#6B7280;font-size:16px;font-weight:500;"> / 100</span>
          </div>
          <p style="color:#6B7280;font-size:14px;margin:12px 0 0;">${totalIssues} item${totalIssues !== 1 ? "s" : ""} need${totalIssues === 1 ? "s" : ""} your attention</p>
        </td></tr>

        ${overdue.length > 0 ? `
        <!-- Overdue maintenance -->
        <tr><td style="padding:0 28px 8px;">
          <p style="color:#DC2626;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">⚠️ Overdue maintenance</p>
          <table role="presentation" width="100%" style="border:1px solid #FECACA;border-radius:10px;overflow:hidden;background:#FEF2F2;">
            ${overdueRows}
          </table>
        </td></tr>` : ""}

        ${dueSoon.length > 0 ? `
        <!-- Due soon -->
        <tr><td style="padding:16px 28px 8px;">
          <p style="color:#D97706;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">🕐 Coming up</p>
          <table role="presentation" width="100%" style="border:1px solid #FDE68A;border-radius:10px;overflow:hidden;background:#FFFBEB;">
            ${dueSoonRows}
          </table>
        </td></tr>` : ""}

        ${inventoryIssues.length > 0 ? `
        <!-- Inventory -->
        <tr><td style="padding:16px 28px 8px;">
          <p style="color:#374151;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">📦 Inventory issues</p>
          <table role="presentation" width="100%" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
            ${inventoryRows}
          </table>
        </td></tr>` : ""}

        <!-- CTA -->
        <tr><td style="padding:24px 28px 28px;text-align:center;">
          <a href="${APP_URL}/health" style="display:inline-block;background:linear-gradient(135deg,#15A0D6,#0B7EB8);color:#FFFFFF;text-decoration:none;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
            View full health report →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 28px;border-top:1px solid #F3F4F6;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">
            You're receiving this because you enabled health summary emails in NautIQ.<br>
            <a href="${APP_URL}/settings" style="color:#6B7280;">Manage notification preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildOverdueAlertEmail(boatName: string, component: ComponentHealth) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;">

        <tr><td style="background:#0B2942;padding:24px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="#5EC6EE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="50" cy="18" r="9"/>
                <line x1="50" y1="27" x2="50" y2="84"/>
                <line x1="26" y1="43" x2="74" y2="43"/>
                <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56"/>
              </svg>
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;"><span style="color:#FFFFFF;">Naut</span><span style="color:#5EC6EE;">IQ</span></span>
            </td>
          </tr></table>
          <p style="color:#5EC6EE;font-size:13px;margin:6px 0 0;opacity:0.85;">${boatName}</p>
        </td></tr>

        <tr><td style="padding:28px 28px 20px;">
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px 24px;">
            <p style="color:#DC2626;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">⚠️ Maintenance overdue</p>
            <p style="color:#111827;font-size:22px;font-weight:700;margin:0 0 4px;">${component.componentName}</p>
            ${component.systemName ? `<p style="color:#6B7280;font-size:14px;margin:0;">${component.systemName}</p>` : ""}
          </div>

          ${component.daysSinceService != null ? `
          <table role="presentation" width="100%" style="margin:20px 0;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
            <tr style="background:#F9FAFB;">
              <td style="padding:12px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #E5E7EB;">Days since last service</td>
              ${component.hoursSinceService != null ? `<td style="padding:12px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #E5E7EB;border-left:1px solid #E5E7EB;">Engine hours since</td>` : ""}
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:24px;font-weight:700;color:#DC2626;">${component.daysSinceService}</td>
              ${component.hoursSinceService != null ? `<td style="padding:12px 16px;font-size:24px;font-weight:700;color:#DC2626;border-left:1px solid #E5E7EB;">${component.hoursSinceService.toFixed(1)}</td>` : ""}
            </tr>
          </table>` : ""}

          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">Log a completed service in NautIQ to clear this alert and reset the maintenance interval.</p>

          <a href="${APP_URL}/maintain" style="display:inline-block;background:linear-gradient(135deg,#15A0D6,#0B7EB8);color:#FFFFFF;text-decoration:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;">
            Log maintenance →
          </a>
        </td></tr>

        <tr><td style="padding:16px 28px;border-top:1px solid #F3F4F6;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">
            You're receiving this because you enabled overdue alerts in NautIQ.<br>
            <a href="${APP_URL}/settings" style="color:#6B7280;">Manage notification preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Resend email sender
// ---------------------------------------------------------------------------

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Inventory issue types (mirrors health page)
// ---------------------------------------------------------------------------

interface InventoryIssue {
  id: string;
  name: string;
  issue: "out_of_stock" | "low_stock" | "expired" | "expiring_soon";
  is_critical: boolean;
}

function getInventoryIssues(
  items: { id: string; name: string; quantity: number; minimum_quantity: number | null; is_critical: boolean; expiry_date: string | null }[],
): InventoryIssue[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in90Days = new Date(today); in90Days.setDate(in90Days.getDate() + 90);
  const issues: InventoryIssue[] = [];

  for (const item of items) {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.minimum_quantity ?? 0);

    if (item.expiry_date) {
      const expiry = new Date(item.expiry_date); expiry.setHours(0, 0, 0, 0);
      if (expiry < today) { issues.push({ id: item.id, name: item.name, issue: "expired", is_critical: item.is_critical }); continue; }
      if (expiry <= in90Days) { issues.push({ id: item.id, name: item.name, issue: "expiring_soon", is_critical: item.is_critical }); continue; }
    }

    if (min > 0 && qty === 0) issues.push({ id: item.id, name: item.name, issue: "out_of_stock", is_critical: item.is_critical });
    else if (min > 0 && qty < min) issues.push({ id: item.id, name: item.name, issue: "low_stock", is_critical: item.is_critical });
  }

  return issues.sort((a, b) => {
    const rank = { expired: 0, out_of_stock: 1, expiring_soon: 2, low_stock: 3 };
    return (rank[a.issue] + (a.is_critical ? 0 : 0.5)) - (rank[b.issue] + (b.is_critical ? 0 : 0.5));
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Allow both scheduled invocations (POST from pg_cron) and manual triggers
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const todayDow = now.getUTCDay(); // 0=Sun … 6=Sat

  // Fetch all users with active notification preferences
  const { data: prefs, error: prefsErr } = await supabase
    .from("notification_preferences")
    .select("*")
    .or("health_summary.neq.none,overdue_alerts.eq.true");

  if (prefsErr) {
    console.error("Failed to load preferences:", prefsErr.message);
    return new Response(JSON.stringify({ error: prefsErr.message }), { status: 500 });
  }

  const results: { userId: string; sent: string[] }[] = [];

  for (const pref of (prefs ?? [])) {
    const sent: string[] = [];

    try {
      // Load boats for this user
      const { data: boatsData } = await supabase
        .from("boats")
        .select("id, name")
        .eq("user_id", pref.user_id);

      const boats = (boatsData ?? []) as { id: string; name: string }[];
      if (boats.length === 0) continue;

      // Use the first/primary boat (could extend to all boats later)
      const boat = boats[0];

      // Fetch components first so we can use their IDs to filter maintenance events
      const { data: componentsData } = await supabase
        .from("components")
        .select("id, name, install_date, service_interval_years, service_interval_months, service_interval_days, service_interval_engine_hours, system:systems(name)")
        .eq("boat_id", boat.id)
        .order("name");

      const componentIds = ((componentsData ?? []) as Record<string, unknown>[]).map((c) => c.id as string);

      // Load trips, maintenance events, and inventory in parallel
      const [{ data: tripsData }, { data: eventsData }, { data: inventoryData }] = await Promise.all([
        supabase
          .from("trips")
          .select("started_at, engine_hours_delta")
          .eq("boat_id", boat.id)
          .not("engine_hours_delta", "is", null)
          .order("started_at"),
        componentIds.length > 0
          ? supabase
              .from("maintenance_events")
              .select("component_id, performed_at, engine_hours_at_service")
              .in("component_id", componentIds)
              .order("performed_at", { ascending: false, nullsFirst: false })
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase
          .from("inventory_items")
          .select("id, name, quantity, minimum_quantity, is_critical, expiry_date")
          .eq("boat_id", boat.id),
      ]);

      type TripRow = { started_at: string | null; engine_hours_delta: number };
      const trips = (tripsData ?? []) as TripRow[];

      // Build latest event per component
      type EventRow = { component_id: string; performed_at: string | null; engine_hours_at_service: number | null };
      const latestEvent = new Map<string, EventRow>();
      for (const e of ((eventsData ?? []) as EventRow[])) {
        if (!latestEvent.has(e.component_id)) latestEvent.set(e.component_id, e);
      }

      // Compute health per component
      const components = (componentsData ?? []) as Record<string, unknown>[];
      const componentHealth = components.map((c) =>
        computeComponentHealth(c, latestEvent.get(c.id as string) ?? null, trips)
      );

      const overdue = componentHealth.filter((c) => c.status === "overdue");
      const dueSoon = componentHealth.filter((c) => c.status === "due_soon");
      const ok = componentHealth.filter((c) => c.status === "ok");

      // Compute overall score (maintenance only for now)
      const healthScore = Math.max(0, Math.round(100 - (overdue.length > 0 ? Math.min(100, overdue.length * 20 + dueSoon.length * 8) : dueSoon.length * 8)));

      // Inventory issues
      type InvRow = { id: string; name: string; quantity: number; minimum_quantity: number | null; is_critical: boolean; expiry_date: string | null };
      const inventoryIssues = getInventoryIssues((inventoryData ?? []) as InvRow[]);

      const hasIssues = overdue.length > 0 || dueSoon.length > 0 || inventoryIssues.length > 0;

      // ---- Health summary email ----
      if (pref.health_summary !== "none" && hasIssues) {
        const shouldSend = pref.health_summary === "daily" ||
          (pref.health_summary === "weekly" && todayDow === (pref.health_summary_day ?? 1));

        const lastSent = pref.last_health_summary_at ? new Date(pref.last_health_summary_at) : null;
        const cooldownHours = pref.health_summary === "daily" ? 20 : 6 * 24;
        const cooldownMs = cooldownHours * 3_600_000;
        const cooldownOk = !lastSent || (now.getTime() - lastSent.getTime()) > cooldownMs;

        if (shouldSend && cooldownOk) {
          const subject = `NautIQ Update: ${boat.name} health report — ${healthScore}/100`;
          const html = buildHealthSummaryEmail(boat.name, healthScore, overdue, dueSoon, inventoryIssues);
          await sendEmail(pref.email, subject, html);

          await supabase
            .from("notification_preferences")
            .update({ last_health_summary_at: now.toISOString() })
            .eq("user_id", pref.user_id);

          sent.push("health_summary");
        }
      }

      // ---- Overdue alerts ----
      if (pref.overdue_alerts && overdue.length > 0) {
        // Load which components have been recently notified (within 7 days)
        const { data: recentNotifs } = await supabase
          .from("component_overdue_notifications")
          .select("component_id, notified_at")
          .eq("user_id", pref.user_id)
          .in("component_id", overdue.map((c) => c.componentId));

        const recentMap = new Map<string, Date>(
          ((recentNotifs ?? []) as { component_id: string; notified_at: string }[])
            .map((r) => [r.component_id, new Date(r.notified_at)])
        );

        for (const component of overdue) {
          const lastNotified = recentMap.get(component.componentId);
          const sevenDaysMs = 7 * 24 * 3_600_000;
          if (lastNotified && (now.getTime() - lastNotified.getTime()) < sevenDaysMs) continue;

          const subject = `NautIQ Update: ${component.componentName} is overdue on ${boat.name}`;
          const html = buildOverdueAlertEmail(boat.name, component);
          await sendEmail(pref.email, subject, html);

          // Upsert the notification record
          await supabase
            .from("component_overdue_notifications")
            .upsert({ user_id: pref.user_id, component_id: component.componentId, notified_at: now.toISOString() }, { onConflict: "user_id,component_id" });

          sent.push(`overdue:${component.componentName}`);
        }
      }

      results.push({ userId: pref.user_id, sent });
    } catch (err) {
      console.error(`Error processing user ${pref.user_id}:`, err);
      results.push({ userId: pref.user_id, sent: [], });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
