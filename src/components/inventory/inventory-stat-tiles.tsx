"use client";

import { useRouter, usePathname } from "next/navigation";

type Tile = {
  label: string;
  count: number;
  filterValue: string;
  activeColor: string;
  activeBorder: string;
  activeLabelColor: string;
  activeNumColor: string;
  idleBackground: string;
  idleBorder: string;
};

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
    // Clicking an already-active filter clears it (toggle off)
    const next = activeStatus === filterValue ? "" : filterValue;
    router.push(buildUrl(next, componentId));
  }

  function handleComponentChange(value: string) {
    router.push(buildUrl(activeStatus, value));
  }

  const tiles: Tile[] = [
    {
      label: "Total items",
      count: totalCount,
      filterValue: "",
      activeColor: "#EEF3F8",
      activeBorder: "#0B7EB8",
      activeLabelColor: "#0B7EB8",
      activeNumColor: "#0B7EB8",
      idleBackground: "#F3F6F9",
      idleBorder: "#E2E9EF",
    },
    {
      label: "Low stock",
      count: lowStockCount,
      filterValue: "low",
      activeColor: "#FDF8EA",
      activeBorder: "#C8841A",
      activeLabelColor: "#C8841A",
      activeNumColor: "#C8841A",
      idleBackground: lowStockCount > 0 ? "#FDF8EA" : "#F3F6F9",
      idleBorder: lowStockCount > 0 ? "#F3E6C4" : "#E2E9EF",
    },
    {
      label: "Critical missing",
      count: missingCount,
      filterValue: "missing",
      activeColor: "#FDF0F0",
      activeBorder: "#D83A3A",
      activeLabelColor: "#D83A3A",
      activeNumColor: "#D83A3A",
      idleBackground: missingCount > 0 ? "#FDF0F0" : "#F3F6F9",
      idleBorder: missingCount > 0 ? "#F8DCDC" : "#E2E9EF",
    },
    {
      label: "Stocked",
      count: stockedCount,
      filterValue: "ok",
      activeColor: "#EEF8F1",
      activeBorder: "#1D9B55",
      activeLabelColor: "#1D9B55",
      activeNumColor: "#1D9B55",
      idleBackground: stockedCount > 0 ? "#EEF8F1" : "#F3F6F9",
      idleBorder: stockedCount > 0 ? "#D2EBDB" : "#E2E9EF",
    },
    {
      label: "Expiring soon",
      count: expiringSoonCount,
      filterValue: "expiring",
      activeColor: "#FDF8EA",
      activeBorder: "#C8841A",
      activeLabelColor: "#C8841A",
      activeNumColor: "#C8841A",
      idleBackground: expiringSoonCount > 0 ? "#FDF8EA" : "#F3F6F9",
      idleBorder: expiringSoonCount > 0 ? "#F3E6C4" : "#E2E9EF",
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
              className="rounded-2xl p-4 flex flex-col gap-1.5 text-left transition-all"
              style={{
                background: tile.idleBackground,
                border: `2px solid ${isActive ? tile.activeBorder : tile.idleBorder}`,
                boxShadow: isActive ? `0 0 0 3px ${tile.activeBorder}22` : "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive
                    ? tile.activeLabelColor
                    : tile.filterValue === "low" && lowStockCount > 0
                    ? "#C8841A"
                    : tile.filterValue === "missing" && missingCount > 0
                    ? "#D83A3A"
                    : tile.filterValue === "ok" && stockedCount > 0
                    ? "#1D9B55"
                    : tile.filterValue === "expiring" && expiringSoonCount > 0
                    ? "#C8841A"
                    : "#8593A0",
                }}
              >
                {tile.label}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: isActive
                    ? tile.activeNumColor
                    : tile.filterValue === "low" && lowStockCount > 0
                    ? "#C8841A"
                    : tile.filterValue === "missing" && missingCount > 0
                    ? "#D83A3A"
                    : tile.filterValue === "ok" && stockedCount > 0
                    ? "#1D9B55"
                    : tile.filterValue === "expiring" && expiringSoonCount > 0
                    ? "#C8841A"
                    : "#46586A",
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
            className="rounded-full border bg-white pl-3 pr-7 py-1 text-xs font-medium text-slate-600 focus:outline-none cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238593A0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              borderColor: componentId ? "#0B7EB8" : "#E2E9EF",
              color: componentId ? "#0B7EB8" : undefined,
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
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
