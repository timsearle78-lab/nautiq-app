"use client";

import { useRef, useState } from "react";
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
  const [pending, setPending] = useState(false);

  if (boats.length === 0) return null;

  if (boats.length === 1) {
    return (
      <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{boats[0].name}</span>
    );
  }

  return (
    <form ref={formRef} action={selectBoat} className="relative flex items-center">
      <input type="hidden" name="return_to" value={pathname} />
      <select
        name="boat_id"
        value={selectedBoatId}
        disabled={pending}
        onChange={() => {
          setPending(true);
          formRef.current?.requestSubmit();
        }}
        className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 cursor-pointer max-w-[120px] truncate disabled:opacity-60"
      >
        {boats.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 text-slate-400">
        {pending ? (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <ChevronDown size={14} />
        )}
      </div>
    </form>
  );
}
