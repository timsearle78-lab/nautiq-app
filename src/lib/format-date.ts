export function formatDate(value: string | null): string {
  if (!value) return "—";
  // Use noon to avoid date-off-by-one for users west of UTC
  return new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}
