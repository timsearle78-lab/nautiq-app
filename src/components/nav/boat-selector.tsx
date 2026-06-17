"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { selectBoat } from "@/app/(app)/actions";
import { ChevronDown } from "lucide-react";

type Boat = { id: string; name: string };

export default function BoatSelector({
  boats,
  selectedBoatId,
}: {
  boats: Boat[];
  selectedBoatId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();

  if (boats.length === 0) return null;

  if (boats.length === 1) {
    return (
      <span className="text-sm font-medium text-slate-700">{boats[0].name}</span>
    );
  }

  return (
    <form ref={formRef} action={selectBoat} className="relative flex items-center">
      <input type="hidden" name="return_to" value={pathname} />
      <select
        name="boat_id"
        value={selectedBoatId}
        onChange={() => formRef.current?.requestSubmit()}
        className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 cursor-pointer"
      >
        {boats.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2 text-slate-400" />
    </form>
  );
}
