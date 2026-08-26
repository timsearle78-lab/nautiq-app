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
      bg: "#F4F7FA",
      activeBg: "#E6F3FA",
      fg: "#0B2942",
      activeFg: "#0B7EB8",
      border: "#DBE3EA",
      activeBorder: "#0B7EB8",
    },
    {
      label: "MISSING",
      count: missingCount,
      filterValue: "missing",
      bg: missingCount > 0 ? "#FDECEA" : "#F4F7FA",
      activeBg: "#FDECEA",
      fg: missingCount > 0 ? "#E0342A" : "#0B2942",
      activeFg: "#E0342A",
      border: missingCount > 0 ? "#F5BCBA" : "#DBE3EA",
      activeBorder: "#E0342A",
    },
    {
      label: "LOW",
      count: lowStockCount,
      filterValue: "low",
      bg: lowStockCount > 0 ? "#FFF6DF" : "#F4F7FA",
      activeBg: "#FFF6DF",
      fg: lowStockCount > 0 ? "#D9A300" : "#0B2942",
      activeFg: "#D9A300",
      border: lowStockCount > 0 ? "#F5E0A0" : "#DBE3EA",
      activeBorder: "#D9A300",
    },
    {
      label: "STOCKED",
      count: stockedCount,
      filterValue: "ok",
      bg: stockedCount > 0 ? "#E6F6EC" : "#F4F7FA",
      activeBg: "#E6F6EC",
      fg: stockedCount > 0 ? "#0E7A3D" : "#0B2942",
      activeFg: "#0E7A3D",
      border: stockedCount > 0 ? "#A8DDB8" : "#DBE3EA",
      activeBorder: "#0E7A3D",
    },
    {
      label: "EXPIRING",
      count: expiringSoonCount,
      filterValue: "expiring",
      bg: expiringSoonCount > 0 ? "#FFF6DF" : "#F4F7FA",
      activeBg: "#FFF6DF",
      fg: expiringSoonCount > 0 ? "#D9A300" : "#0B2942",
      activeFg: "#D9A300",
      border: expiringSoonCount > 0 ? "#F5E0A0" : "#DBE3EA",
      activeBorder: "#D9A300",
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
                  opacity: isActive ? 1 : 0.6,
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
              border: `1.5px solid ${componentId ? "#0B7EB8" : "#DBE3EA"}`,
              color: componentId ? "#0B7EB8" : "#0B2942",
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
              style={{ fontSize: 12, color: "#8FB3CC", fontWeight: 600 }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
