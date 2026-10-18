import Link from "next/link";

type Dir = "asc" | "desc";

export function SortableTh({
  href,
  label,
  active,
  dir,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  dir: Dir | null;
  className?: string;
}) {
  return (
    <th className={className}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-slate-800 transition-colors select-none whitespace-nowrap ${active ? "text-slate-800" : ""}`}
      >
        {label}
        <span
          className="text-[10px] leading-none"
          style={{ color: active ? "var(--color-ocean-600, #0369a1)" : "#CBD5E1" }}
        >
          {active ? (dir === "asc" ? "▲" : "▼") : "⬍"}
        </span>
      </Link>
    </th>
  );
}

/** Build the href for a sortable column header.
 *  Cycles: inactive → asc → desc → default (removes sort params) */
export function sortHref(
  pathname: string,
  existingParams: Record<string, string>,
  col: string,
  currentSort: string | null,
  currentDir: string | null,
  sortKey = "sort",
  dirKey = "dir"
): string {
  const params = new URLSearchParams(existingParams);
  const isActive = currentSort === col;
  if (!isActive) {
    params.set(sortKey, col);
    params.set(dirKey, "asc");
  } else if (currentDir === "asc") {
    params.set(sortKey, col);
    params.set(dirKey, "desc");
  } else {
    params.delete(sortKey);
    params.delete(dirKey);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
