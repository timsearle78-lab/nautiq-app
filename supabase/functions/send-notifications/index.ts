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
  _maxRatio: number | null;
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
    _maxRatio: maxRatio > 0 ? maxRatio : null,
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

const EMAIL_FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`;

const LOGO_SVG = `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
  <td style="vertical-align:middle;padding-right:9px;">
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none" stroke="#5EC6EE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="50" cy="18" r="9"/>
      <line x1="50" y1="27" x2="50" y2="84"/>
      <line x1="26" y1="43" x2="74" y2="43"/>
      <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56"/>
    </svg>
  </td>
  <td style="vertical-align:middle;">
    <span style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1;"><span style="color:#FFFFFF;">Naut</span><span style="color:#5EC6EE;">IQ</span></span>
  </td>
</tr></table>`;

const EMAIL_HEADER_STYLE = `background:radial-gradient(120% 140% at 85% 0%,#0D4A73 0%,#0B2942 50%,#061D31 100%);padding:24px 32px;`;

const EMAIL_BODY_FONT = `font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;`;

function emailShell(bodyContent: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${EMAIL_FONT}</style>
</head>
<body style="margin:0;padding:0;background:#EEF1F5;${EMAIL_BODY_FONT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F5;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(11,41,66,0.10);">
        ${bodyContent}
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#8593A0;${EMAIL_BODY_FONT}">NautIQ · <a href="${APP_URL}" style="color:#8593A0;text-decoration:none;">nautiq.app</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildHealthSummaryEmail(boatName: string, score: number, overdue: ComponentHealth[], dueSoon: ComponentHealth[], inventoryIssues: InventoryIssue[]) {
  const totalIssues = overdue.length + dueSoon.length + inventoryIssues.length;

  const overdueRows = overdue.map((c, i) => `
    <tr>
      <td style="padding:10px 16px;${i < overdue.length - 1 ? "border-bottom:1px solid #FECACA;" : ""}">
        <span style="font-size:14px;font-weight:600;color:#0F2335;">${c.componentName}</span>
        ${c.systemName ? `<br><span style="font-size:12px;color:#8593A0;">${c.systemName}</span>` : ""}
      </td>
      <td style="padding:10px 16px;text-align:right;${i < overdue.length - 1 ? "border-bottom:1px solid #FECACA;" : ""}">
        <span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700;white-space:nowrap;">Overdue</span>
      </td>
    </tr>`).join("");

  const dueSoonRows = dueSoon.map((c, i) => `
    <tr>
      <td style="padding:10px 16px;${i < dueSoon.length - 1 ? "border-bottom:1px solid #FDE68A;" : ""}">
        <span style="font-size:14px;font-weight:600;color:#0F2335;">${c.componentName}</span>
        ${c.systemName ? `<br><span style="font-size:12px;color:#8593A0;">${c.systemName}</span>` : ""}
        ${c.predictedDueDate ? `<br><span style="font-size:12px;color:#C8841A;">Due ${formatDate(c.predictedDueDate)}</span>` : ""}
      </td>
      <td style="padding:10px 16px;text-align:right;${i < dueSoon.length - 1 ? "border-bottom:1px solid #FDE68A;" : ""}">
        <span style="background:#FFFBEB;color:#C8841A;border:1px solid #FDE68A;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700;white-space:nowrap;">Due soon</span>
      </td>
    </tr>`).join("");

  const inventoryRows = inventoryIssues.slice(0, 5).map((item, i) => {
    const isRed = item.issue === "expired" || item.issue === "out_of_stock";
    const badgeBg = isRed ? "#FEF2F2" : "#FFFBEB";
    const badgeColor = isRed ? "#DC2626" : "#C8841A";
    const badgeBorder = isRed ? "#FECACA" : "#FDE68A";
    const borderColor = isRed ? "#FECACA" : "#FDE68A";
    const badgeLabel = item.issue === "expired" ? "Expired" : item.issue === "out_of_stock" ? "Out of stock" : item.issue === "expiring_soon" ? "Expiring soon" : "Low stock";
    return `
    <tr>
      <td style="padding:10px 16px;${i < Math.min(inventoryIssues.length, 5) - 1 ? `border-bottom:1px solid ${borderColor};` : ""}">
        <span style="font-size:14px;font-weight:600;color:#0F2335;">${item.name}</span>
        ${item.is_critical ? `<br><span style="font-size:12px;color:#8593A0;">Critical spare</span>` : ""}
      </td>
      <td style="padding:10px 16px;text-align:right;${i < Math.min(inventoryIssues.length, 5) - 1 ? `border-bottom:1px solid ${borderColor};` : ""}">
        <span style="background:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700;white-space:nowrap;">${badgeLabel}</span>
      </td>
    </tr>`;
  }).join("");

  const body = `
    <!-- Header -->
    <tr><td style="${EMAIL_HEADER_STYLE}">
      ${LOGO_SVG}
      <p style="color:rgba(159,186,206,0.85);font-size:13px;margin:8px 0 0;${EMAIL_BODY_FONT}">${boatName} — Boat Health Summary</p>
    </td></tr>

    <!-- Intro -->
    <tr><td style="padding:28px 32px 20px;">
      <p style="font-size:15px;color:#0F2335;font-weight:600;margin:0 0 4px;">${totalIssues} item${totalIssues !== 1 ? "s" : ""} need${totalIssues === 1 ? "s" : ""} your attention</p>
      <p style="font-size:14px;color:#8593A0;margin:0;line-height:1.5;">Here's a summary of your boat's maintenance status.</p>
    </td></tr>

    ${overdue.length > 0 ? `
    <!-- Overdue -->
    <tr><td style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#DC2626;margin:0 0 8px;">Overdue maintenance</p>
      <table role="presentation" width="100%" style="border:1.5px solid #FECACA;border-radius:12px;overflow:hidden;background:#FEF9F9;">
        ${overdueRows}
      </table>
    </td></tr>` : ""}

    ${dueSoon.length > 0 ? `
    <!-- Due soon -->
    <tr><td style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#C8841A;margin:0 0 8px;">Coming up</p>
      <table role="presentation" width="100%" style="border:1.5px solid #FDE68A;border-radius:12px;overflow:hidden;background:#FFFDF5;">
        ${dueSoonRows}
      </table>
    </td></tr>` : ""}

    ${inventoryIssues.length > 0 ? `
    <!-- Inventory -->
    <tr><td style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#475569;margin:0 0 8px;">Inventory issues</p>
      <table role="presentation" width="100%" style="border:1.5px solid #E0E6EC;border-radius:12px;overflow:hidden;">
        ${inventoryRows}
      </table>
    </td></tr>` : ""}

    <!-- CTA -->
    <tr><td style="padding:8px 32px 32px;text-align:center;">
      <a href="${APP_URL}/health" style="display:inline-block;background:linear-gradient(135deg,#15A0D6,#0B7EB8);color:#FFFFFF;text-decoration:none;border-radius:12px;padding:13px 32px;font-size:14px;font-weight:700;letter-spacing:0.1px;${EMAIL_BODY_FONT}box-shadow:0 4px 12px rgba(11,126,184,0.28);">
        View full health report →
      </a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:16px 32px;border-top:1px solid #EEF1F5;text-align:center;background:#F8FAFC;">
      <p style="color:#8593A0;font-size:12px;margin:0;line-height:1.6;${EMAIL_BODY_FONT}">
        You're receiving this because you enabled health summary emails in NautIQ.<br>
        <a href="${APP_URL}/settings" style="color:#0B7EB8;text-decoration:none;">Manage notification preferences</a>
      </p>
    </td></tr>`;

  return emailShell(body);
}

function buildOverdueAlertEmail(boatName: string, component: ComponentHealth) {
  const body = `
    <!-- Header -->
    <tr><td style="${EMAIL_HEADER_STYLE}">
      ${LOGO_SVG}
      <p style="color:rgba(159,186,206,0.85);font-size:13px;margin:8px 0 0;${EMAIL_BODY_FONT}">${boatName}</p>
    </td></tr>

    <!-- Alert card -->
    <tr><td style="padding:28px 32px 0;">
      <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:14px;padding:20px 24px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#DC2626;margin:0 0 8px;">Maintenance overdue</p>
        <p style="font-size:22px;font-weight:800;color:#0F2335;margin:0 0 4px;letter-spacing:-0.3px;${EMAIL_BODY_FONT}">${component.componentName}</p>
        ${component.systemName ? `<p style="font-size:14px;color:#8593A0;margin:0;">${component.systemName}</p>` : ""}
      </div>
    </td></tr>

    ${component.daysSinceService != null ? `
    <!-- Stats -->
    <tr><td style="padding:20px 32px 0;">
      <table role="presentation" width="100%" style="border:1.5px solid #E0E6EC;border-radius:12px;overflow:hidden;">
        <tr style="background:#F8FAFC;">
          <td style="padding:10px 16px;font-size:11px;color:#8593A0;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;border-bottom:1px solid #E0E6EC;">Days since last service</td>
          ${component.hoursSinceService != null ? `<td style="padding:10px 16px;font-size:11px;color:#8593A0;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;border-bottom:1px solid #E0E6EC;border-left:1px solid #E0E6EC;">Engine hours since</td>` : ""}
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:28px;font-weight:800;color:#DC2626;${EMAIL_BODY_FONT}">${component.daysSinceService}</td>
          ${component.hoursSinceService != null ? `<td style="padding:12px 16px;font-size:28px;font-weight:800;color:#DC2626;border-left:1px solid #E0E6EC;${EMAIL_BODY_FONT}">${component.hoursSinceService.toFixed(1)}</td>` : ""}
        </tr>
      </table>
    </td></tr>` : ""}

    <!-- Body text + CTA -->
    <tr><td style="padding:24px 32px 32px;">
      <p style="font-size:14px;color:#475569;line-height:1.65;margin:0 0 24px;">Log a completed service in NautIQ to clear this alert and reset the maintenance interval.</p>
      <a href="${APP_URL}/maintain" style="display:inline-block;background:linear-gradient(135deg,#15A0D6,#0B7EB8);color:#FFFFFF;text-decoration:none;border-radius:12px;padding:13px 28px;font-size:14px;font-weight:700;${EMAIL_BODY_FONT}box-shadow:0 4px 12px rgba(11,126,184,0.28);">
        Log maintenance →
      </a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:16px 32px;border-top:1px solid #EEF1F5;text-align:center;background:#F8FAFC;">
      <p style="color:#8593A0;font-size:12px;margin:0;line-height:1.6;${EMAIL_BODY_FONT}">
        You're receiving this because you enabled overdue alerts in NautIQ.<br>
        <a href="${APP_URL}/settings" style="color:#0B7EB8;text-decoration:none;">Manage notification preferences</a>
      </p>
    </td></tr>`;

  return emailShell(body);
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
    .from("user_settings")
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

      // Build inventory penalty map — same logic as the app's getBoatHealth()
      type InvRow = { id: string; name: string; quantity: number; minimum_quantity: number | null; is_critical: boolean; expiry_date: string | null };
      const invItems = (inventoryData ?? []) as (InvRow & { component_id?: string | null })[];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in30Days = new Date(today); in30Days.setDate(in30Days.getDate() + 30);
      const in90Days = new Date(today); in90Days.setDate(in90Days.getDate() + 90);
      const stockPenaltyMap = new Map<string, number>();
      let boatExpiryPenalty = 0;
      for (const item of invItems) {
        const qty = Number(item.quantity ?? 0);
        const min = Number(item.minimum_quantity ?? 0);
        const isCritical = item.is_critical;
        let stockPenalty = 0;
        if (min > 0 && qty === 0) stockPenalty = isCritical ? 40 : 25;
        else if (min > 0 && qty < min) stockPenalty = isCritical ? 25 : 15;
        else if (min > 0 && qty === min) stockPenalty = isCritical ? 10 : 5;
        let expiryPenalty = 0;
        if (item.expiry_date) {
          const expiry = new Date(item.expiry_date); expiry.setHours(0, 0, 0, 0);
          if (expiry < today) expiryPenalty = isCritical ? 40 : 25;
          else if (expiry <= in30Days) expiryPenalty = isCritical ? 25 : 15;
          else if (expiry <= in90Days) expiryPenalty = isCritical ? 10 : 5;
        }
        const totalPenalty = stockPenalty + expiryPenalty;
        if (!totalPenalty) continue;
        if (item.component_id) {
          stockPenaltyMap.set(item.component_id, (stockPenaltyMap.get(item.component_id) ?? 0) + totalPenalty);
        } else {
          boatExpiryPenalty += expiryPenalty;
        }
      }

      // Compute health per component
      const components = (componentsData ?? []) as Record<string, unknown>[];
      const componentHealth = components.map((c) =>
        computeComponentHealth(c, latestEvent.get(c.id as string) ?? null, trips)
      );

      const overdue = componentHealth.filter((c) => c.status === "overdue");
      const dueSoon = componentHealth.filter((c) => c.status === "due_soon");
      const ok = componentHealth.filter((c) => c.status === "ok");

      // Compute overall score matching the app's algorithm:
      // average risk_score (maxRatio*100 + inventory penalty) across all components,
      // plus a synthetic inventory row for unlinked expiry penalties.
      const riskScores = componentHealth.map((h) => {
        const stockPenalty = stockPenaltyMap.get(h.componentId) ?? 0;
        const baseScore = h._maxRatio != null ? Math.round(h._maxRatio * 100) : 0;
        return baseScore + stockPenalty;
      });
      if (boatExpiryPenalty > 0) riskScores.push(Math.min(boatExpiryPenalty, 100));
      const avgRisk = riskScores.length > 0 ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0;
      const healthScore = Math.max(0, Math.round(100 - avgRisk));

      // Inventory issues
      const inventoryIssues = getInventoryIssues(invItems);

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
          const subject = `NautIQ Update: ${boat.name} health report`;
          const html = buildHealthSummaryEmail(boat.name, healthScore, overdue, dueSoon, inventoryIssues);
          await sendEmail(pref.email, subject, html);

          await supabase
            .from("user_settings")
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
