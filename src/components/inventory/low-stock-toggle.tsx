"use client";

import { useRouter, usePathname } from "next/navigation";

export function LowStockToggle({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(checked: boolean) {
    const url = checked ? `${pathname}?low=1` : pathname;
    router.push(url);
  }

  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={() => handleChange(!active)}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        style={{ background: active ? "#0B7EB8" : "#CBD5E1" }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: active ? "translateX(26px)" : "translateX(4px)" }}
        />
      </button>
      <span className="text-sm font-medium" style={{ color: active ? "#0B7EB8" : "#8593A0" }}>
        Low stock only
      </span>
    </label>
  );
}
