"use client";

import { useRouter, usePathname } from "next/navigation";

export function InventoryStatTiles({
  totalCount,
  lowStockCount,
  missingCount,
  stockedCount,
  expiringSoonCount,
  activeStatus,
  componentId,
  components,
}: {
  totalCount: number;
  lowStockCount: number;
  missingCount: number;
  stockedCount: number;
  expiringSoonCount: number;
  activeStatus: string;
  componentId: string;
  components: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(nextStatus: string, nextComponentId: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextComponentId) params.set("component", nextComponentId);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleTileClick(filterValue: string) {
    const next = activeStatus === filterValue ? "" : filterValue;
    router.push(buildUrl(next, componentId));
  }

  function handleComponentChange(value: string) {
    router.push(buildUrl(activeStatus, value));
  }

  const tiles = [
    {
      label: "TOTAL",
      count: totalCount,
      filterValue: "",
      bg: "var(--color-app-bg)",
      activeBg: "var(--color-ocean-600)",
      fg: "var(--color-navy-700)",
      activeFg: "#FFFFFF",
      border: "var(--color-border)",
      activeBorder: "var(--color-ocean-600)",
    },
    {
      label: "MISSING",
      count: missingCount,
      filterValue: "missing",
      bg: missingCount > 0 ? "var(--color-status-critical-fg)" : "var(--color-app-bg)",
      activeBg: "var(--color-status-critical-fg)",
      fg: missingCount > 0 ? "#FFFFFF" : "var(--color-navy-700)",
      activeFg: "#FFFFFF",
      border: missingCount > 0 ? "var(--color-status-critical-fg)" : "var(--color-border)",
      activeBorder: "var(--color-status-critical-fg)",
    },
    {
      label: "LOW",
      count: lowStockCount,
      filterValue: "low",
      bg: lowStockCount > 0 ? "var(--color-status-warning-fg)" : "var(--color-app-bg)",
      activeBg: "var(--color-status-warning-fg)",
      fg: lowStockCount > 0 ? "var(--color-amber-ink)" : "var(--color-navy-700)",
      activeFg: "var(--color-amber-ink)",
      border: lowStockCount > 0 ? "var(--color-status-warning-fg)" : "var(--color-border)",
      activeBorder: "var(--color-status-warning-fg)",
    },
    {
      label: "STOCKED",
      count: stockedCount,
      filterValue: "ok",
      bg: stockedCount > 0 ? "var(--color-status-healthy-fg)" : "var(--color-app-bg)",
      activeBg: "var(--color-status-healthy-fg)",
      fg: stockedCount > 0 ? "#FFFFFF" : "var(--color-navy-700)",
      activeFg: "#FFFFFF",
      border: stockedCount > 0 ? "var(--color-status-healthy-fg)" : "var(--color-border)",
      activeBorder: "var(--color-status-healthy-fg)",
    },
    {
      label: "EXPIRING",
      count: expiringSoonCount,
      filterValue: "expiring",
      bg: expiringSoonCount > 0 ? "var(--color-status-warning-fg)" : "var(--color-app-bg)",
      activeBg: "var(--color-status-warning-fg)",
      fg: expiringSoonCount > 0 ? "var(--color-amber-ink)" : "var(--color-navy-700)",
      activeFg: "var(--color-amber-ink)",
      border: expiringSoonCount > 0 ? "var(--color-status-warning-fg)" : "var(--color-border)",
      activeBorder: "var(--color-status-warning-fg)",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((tile) => {
          const isActive = activeStatus === tile.filterValue;
          return (
            <button
              key={tile.filterValue}
              type="button"
              onClick={() => handleTileClick(tile.filterValue)}
              className="rounded-[18px] p-4 flex flex-col gap-1 text-left transition-all"
              style={{
                background: isActive ? tile.activeBg : tile.bg,
                border: `1.5px solid ${isActive ? tile.activeBorder : tile.border}`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: isActive ? tile.activeFg : tile.fg,
                  opacity: 1,
                }}
              >
                {tile.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: isActive ? tile.activeFg : tile.fg,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tile.count}
              </div>
            </button>
          );
        })}
      </div>

      {components.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={componentId}
            onChange={(e) => handleComponentChange(e.target.value)}
            className="rounded-full bg-white pl-3 pr-7 py-1 text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FB3CC' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              border: `1.5px solid ${componentId ? "var(--color-ocean-600)" : "var(--color-border)"}`,
              color: componentId ? "var(--color-ocean-600)" : "var(--color-navy-700)",
            }}
          >
            <option value="">All components</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {(activeStatus || componentId) && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              style={{ fontSize: 12, color: "var(--color-navy-mute)", fontWeight: 600 }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
