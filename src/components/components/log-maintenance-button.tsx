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
        className="flex items-center gap-2 rounded-xl btn-primary px-4 py-2.5 text-sm font-semibold text-white transition"
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
