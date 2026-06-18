import { createClient } from "@/lib/supabase/server";
import type {
  ComponentDetail,
  MaintenanceHistoryRow,
} from "@/lib/components/queries";

export type ComponentHealthSummary = {
  status: "ok" | "due_soon" | "overdue" | "unknown";
  score: number | null;
  lastServiceDate: string | null;
  lastServiceEngineHours: number | null;
  hoursSinceService: number | null;
  daysSinceService: number | null;
  predictedDueDate: string | null;
  reasons: string[];
};

function daysBetween(fromIso: string, toDate = new Date()) {
  const from = new Date(fromIso);
  const diffMs = toDate.getTime() - from.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// Convert years + months + days into a total day count for ratio calculations.
function totalIntervalDays(
  years: number | null,
  months: number | null,
  days: number | null
): number | null {
  const total =
    (years ?? 0) * 365 + (months ?? 0) * 30 + (days ?? 0);
  return total > 0 ? total : null;
}

type TripForHealth = { started_at: string | null; engine_hours_delta: number };

export function getComponentHealthSummary(
  component: ComponentDetail,
  maintenanceHistory: MaintenanceHistoryRow[],
  trips: TripForHealth[]
): ComponentHealthSummary {
  const latestService = maintenanceHistory[0] ?? null;
  // Fall back to install_date when no maintenance has been recorded yet,
  // so the service interval counts from when the component was fitted.
  const lastServiceDate = latestService?.performed_at ?? component.install_date ?? null;
  const lastServiceEngineHours =
    latestService?.engine_hours_at_service ?? null;

  const daysSinceService =
    lastServiceDate ? daysBetween(lastServiceDate) : null;

  // Sum engine hours from trips on or after the last service date.
  // Slice to YYYY-MM-DD to handle full ISO timestamps vs bare date strings.
  const serviceDay = lastServiceDate?.slice(0, 10) ?? null;
  const hoursSinceService = serviceDay != null
    ? trips
        .filter((t) => t.started_at != null && t.started_at.slice(0, 10) > serviceDay)
        .reduce((sum, t) => sum + (t.engine_hours_delta ?? 0), 0)
    : null;

  const reasons: string[] = [];

  const dayInterval = totalIntervalDays(
    component.service_interval_years ?? null,
    component.service_interval_months ?? null,
    component.service_interval_days
  );
  const hourInterval = component.service_interval_engine_hours;

  let dayRatio: number | null = null;
  let hourRatio: number | null = null;

  if (dayInterval && dayInterval > 0 && daysSinceService != null) {
    dayRatio = daysSinceService / dayInterval;
  }

  if (hourInterval && hourInterval > 0 && hoursSinceService != null) {
    hourRatio = hoursSinceService / hourInterval;
  }

  const maxRatio = Math.max(dayRatio ?? 0, hourRatio ?? 0);

  if (!lastServiceDate && lastServiceEngineHours == null) {
    return {
      status: "unknown",
      score: null,
      lastServiceDate: null,
      lastServiceEngineHours: null,
      hoursSinceService,
      daysSinceService,
      predictedDueDate: null,
      reasons: ["No service history or install date recorded yet."],
    };
  }

  if (dayRatio != null && dayRatio >= 1) {
    reasons.push("Past time-based service interval.");
  } else if (dayRatio != null && dayRatio >= 0.85) {
    reasons.push("Approaching time-based service interval.");
  }

  if (hourRatio != null && hourRatio >= 1) {
    reasons.push("Past engine-hour service interval.");
  } else if (hourRatio != null && hourRatio >= 0.85) {
    reasons.push("Approaching engine-hour service interval.");
  }

  let status: ComponentHealthSummary["status"] = "ok";
  if (maxRatio >= 1) status = "overdue";
  else if (maxRatio >= 0.85) status = "due_soon";

  let score: number | null = null;
  if (maxRatio > 0) {
    score = Math.max(0, Math.min(100, Math.round(100 - maxRatio * 100)));
  } else {
    score = 100;
  }

  // Predicted due date: whichever threshold (time or hours) is reached first.
  let predictedDueDate: string | null = null;
  if (lastServiceDate && dayInterval && dayInterval > 0) {
    const due = new Date(lastServiceDate);
    due.setDate(due.getDate() + dayInterval);
    predictedDueDate = due.toISOString().slice(0, 10);
  }
  if (
    hourInterval && hourInterval > 0 &&
    hoursSinceService != null && hoursSinceService > 0 &&
    daysSinceService != null && daysSinceService > 0
  ) {
    const hoursRemaining = hourInterval - hoursSinceService;
    const hoursPerDay = hoursSinceService / daysSinceService;
    const daysUntil = Math.round(hoursRemaining / hoursPerDay);
    const hoursBased = new Date();
    hoursBased.setDate(hoursBased.getDate() + daysUntil);
    const hoursBasedStr = hoursBased.toISOString().slice(0, 10);
    if (predictedDueDate === null || hoursBasedStr < predictedDueDate) {
      predictedDueDate = hoursBasedStr;
    }
  }

  return {
    status,
    score,
    lastServiceDate,
    lastServiceEngineHours,
    hoursSinceService,
    daysSinceService,
    predictedDueDate,
    reasons: reasons.length ? reasons : ["Within service interval."],
  };
}

// ---------------------------------------------------------------------------
// Boat-level health — replaces the get_boat_health RPC so all pages use the
// same algorithm as the component detail page.
// ---------------------------------------------------------------------------

export type BoatHealthRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  risk_score: number | null;
  status: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  months_until_due: number | null;
  predicted_due_date: string | null;
};

export async function getBoatHealth(boatId: string): Promise<BoatHealthRow[]> {
  const supabase = await createClient();

  const [{ data: componentsData }, { data: tripsData }] = await Promise.all([
    supabase
      .from("components")
      .select("id, name, install_date, service_interval_years, service_interval_months, service_interval_days, service_interval_engine_hours, system:systems(id, name)")
      .eq("boat_id", boatId)
      .order("name"),
    supabase
      .from("trips")
      .select("started_at, engine_hours_delta")
      .eq("boat_id", boatId)
      .not("engine_hours_delta", "is", null)
      .order("started_at", { ascending: true }),
  ]);

  if (!componentsData || componentsData.length === 0) return [];

  const componentIds = componentsData.map((c: Record<string, unknown>) => c.id as string);

  type TripRow = { started_at: string | null; engine_hours_delta: number };
  const trips = (tripsData ?? []) as TripRow[];

  // Fetch latest maintenance event per component in one query
  const { data: eventsData } = await supabase
    .from("maintenance_events")
    .select("component_id, performed_at, engine_hours_at_service")
    .in("component_id", componentIds)
    .order("performed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  type EventRow = { component_id: string; performed_at: string | null; engine_hours_at_service: number | null };
  const latestEvent = new Map<string, EventRow>();
  for (const e of ((eventsData ?? []) as EventRow[])) {
    if (!latestEvent.has(e.component_id)) latestEvent.set(e.component_id, e);
  }

  return (componentsData as Record<string, unknown>[]).map((c) => {
    const systemArr = c.system as { id: string; name: string }[] | { id: string; name: string } | null;
    const system = Array.isArray(systemArr) ? systemArr[0] : systemArr;

    const event = latestEvent.get(c.id as string) ?? null;
    // Fall back to install_date when no maintenance has been recorded yet.
    const lastServiceDate = event?.performed_at ?? (c.install_date as string | null) ?? null;

    const daysSinceService = lastServiceDate ? daysBetween(lastServiceDate) : null;

    // Sum engine hours from trips strictly after the last service date.
    const serviceDay = lastServiceDate?.slice(0, 10) ?? null;
    const hoursSinceService = serviceDay != null
      ? trips
          .filter((t) => t.started_at != null && t.started_at.slice(0, 10) > serviceDay)
          .reduce((sum, t) => sum + (t.engine_hours_delta ?? 0), 0)
      : null;

    const dayInterval = totalIntervalDays(
      (c.service_interval_years as number | null) ?? null,
      (c.service_interval_months as number | null) ?? null,
      (c.service_interval_days as number | null) ?? null
    );
    const hourInterval = (c.service_interval_engine_hours as number | null) ?? null;

    let dayRatio: number | null = null;
    let hourRatio: number | null = null;
    if (dayInterval && dayInterval > 0 && daysSinceService != null) dayRatio = daysSinceService / dayInterval;
    if (hourInterval && hourInterval > 0 && hoursSinceService != null) hourRatio = hoursSinceService / hourInterval;

    const maxRatio = Math.max(dayRatio ?? 0, hourRatio ?? 0);

    let status: string;
    let risk_score: number | null;

    if (!lastServiceDate) {
      status = "unknown";
      risk_score = null;
    } else if (maxRatio >= 1) {
      status = "overdue";
      risk_score = Math.round(maxRatio * 100);
    } else if (maxRatio >= 0.85) {
      status = "due soon";
      risk_score = Math.round(maxRatio * 100);
    } else {
      status = "ok";
      risk_score = maxRatio > 0 ? Math.round(maxRatio * 100) : 0;
    }

    const hours_until_due =
      hourInterval != null && hoursSinceService != null ? hourInterval - hoursSinceService : null;
    const months_until_due =
      dayInterval != null && daysSinceService != null
        ? Math.ceil((dayInterval - daysSinceService) / 30)
        : null;

    // Predicted due date: whichever threshold (time or hours) is reached first.
    let predicted_due_date: string | null = null;

    // Time-based: last service date + day interval
    if (lastServiceDate && dayInterval != null) {
      const due = new Date(lastServiceDate);
      due.setDate(due.getDate() + dayInterval);
      predicted_due_date = due.toISOString().slice(0, 10);
    }

    // Hours-based: extrapolate from current usage rate (hours/day since last service)
    // Rate = hoursSinceService / daysSinceService → daysUntilDue = hoursUntilDue / rate
    if (
      hourInterval != null &&
      hours_until_due != null &&
      hoursSinceService != null && hoursSinceService > 0 &&
      daysSinceService != null && daysSinceService > 0
    ) {
      const hoursPerDay = hoursSinceService / daysSinceService;
      const daysUntilHoursDue = Math.round(hours_until_due / hoursPerDay);
      const hoursBased = new Date();
      hoursBased.setDate(hoursBased.getDate() + daysUntilHoursDue);
      const hoursBasedStr = hoursBased.toISOString().slice(0, 10);
      // Use whichever date comes sooner
      if (predicted_due_date === null || hoursBasedStr < predicted_due_date) {
        predicted_due_date = hoursBasedStr;
      }
    }

    return {
      component_id: c.id as string,
      component_name: c.name as string,
      system_name: system?.name ?? null,
      risk_score,
      status,
      hours_since_service: hoursSinceService,
      hours_until_due,
      months_until_due,
      predicted_due_date,
    };
  });
}
