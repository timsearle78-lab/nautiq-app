"use client";

import { useRouter, usePathname } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ok", label: "OK" },
  { value: "low", label: "Low" },
  { value: "missing", label: "Missing" },
  { value: "expiring", label: "Expiring" },
];

export function InventoryFilters({
  status,
  componentId,
  components,
}: {
  status: string;
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

  function setStatus(value: string) {
    router.push(buildUrl(value, componentId));
  }

  function setComponent(value: string) {
    router.push(buildUrl(status, value));
  }

  const chipBase = "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer";
  const chipActive = "border-ocean-500 bg-ocean-500 text-white";
  const chipInactive = "border-slate-200 bg-white text-slate-600 hover:border-ocean-300 hover:text-ocean-600";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setStatus(opt.value)}
          className={`${chipBase} ${status === opt.value ? chipActive : chipInactive}`}
        >
          {opt.label}
        </button>
      ))}

      {components.length > 0 && (
        <select
          value={componentId}
          onChange={(e) => setComponent(e.target.value)}
          className="ml-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 focus:outline-none focus:border-ocean-400 cursor-pointer"
          style={{ color: componentId ? "#0B7EB8" : undefined, borderColor: componentId ? "#0B7EB8" : undefined }}
        >
          <option value="">All components</option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
