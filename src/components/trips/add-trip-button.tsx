"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import LogTripSheet from "@/components/chat/log-trip-sheet";

export function AddTripButton({ boatId }: { boatId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSaved = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700"
      >
        <Plus size={16} />
        Log Trip
      </button>
      {open && (
        <LogTripSheet
          boatId={boatId}
          onClose={() => setOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
