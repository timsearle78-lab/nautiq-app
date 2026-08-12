export type StatusFilter = "all" | "overdue" | "due_soon" | "ok" | "unknown";

export function normalizeStatus(status: string | null): StatusFilter {
  const value = (status ?? "").toLowerCase();
  if (value === "overdue") return "overdue";
  if (value === "due soon" || value === "due_soon") return "due_soon";
  if (value === "ok") return "ok";
  return "unknown";
}
