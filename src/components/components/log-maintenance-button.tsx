"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import LogMaintenanceSheet from "./log-maintenance-sheet";

type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };

export default function LogMaintenanceButton({
  componentId,
  boatId,
  inventoryOptions,
}: {
  componentId: string;
  boatId: string;
  inventoryOptions: InventoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
        style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)", boxShadow: "0 4px 12px rgba(11,126,184,.35)" }}
      >
        <Plus size={16} />
        Log Maintenance
      </button>

      {open && (
        <LogMaintenanceSheet
          boatId={boatId}
          componentId={componentId}
          inventoryOptions={inventoryOptions}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}
