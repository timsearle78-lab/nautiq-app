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
  reasons: string[];
};

function daysBetween(fromIso: string, toDate = new Date()) {
  const from = new Date(fromIso);
  const diffMs = toDate.getTime() - from.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getComponentHealthSummary(
  component: ComponentDetail,
  maintenanceHistory: MaintenanceHistoryRow[],
  latestBoatEngineHours: number | null
): ComponentHealthSummary {
  const latestService = maintenanceHistory[0] ?? null;
  const lastServiceDate = latestService?.performed_at ?? null;
  const lastServiceEngineHours =
    latestService?.engine_hours_at_service ?? null;

  const daysSinceService =
    lastServiceDate ? daysBetween(lastServiceDate) : null;

  const hoursSinceService =
    latestBoatEngineHours != null && lastServiceEngineHours != null
      ? Math.max(0, latestBoatEngineHours - lastServiceEngineHours)
      : null;

  const reasons: string[] = [];

  const dayInterval = component.service_interval_days;
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
      reasons: ["No service history recorded yet."],
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

  return {
    status,
    score,
    lastServiceDate,
    lastServiceEngineHours,
    hoursSinceService,
    daysSinceService,
    reasons: reasons.length ? reasons : ["Within service interval."],
  };
}