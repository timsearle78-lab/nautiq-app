"use client";

import { useState } from "react";
import { Timer } from "lucide-react";
import { useTripTimer, formatElapsed, type GpsCoords } from "@/hooks/use-trip-timer";
import LogTripSheet from "@/components/chat/log-trip-sheet";
import { useRouter } from "next/navigation";

export default function TripTimerButton({ boatId }: { boatId: string }) {
  const { activeTrip, elapsed, startTrip, stopTrip } = useTripTimer(boatId);
  const [showSheet, setShowSheet] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [startCoords, setStartCoords] = useState<GpsCoords | null>(null);
  const [endCoords, setEndCoords] = useState<GpsCoords | null>(null);
  const [stopping, setStopping] = useState(false);
  const router = useRouter();

  async function handleStop() {
    setStopping(true);
    const { trip, endCoords: ec } = await stopTrip();
    setStopping(false);
    setStartedAt(trip?.startedAt ?? null);
    setStartCoords(trip?.startCoords ?? null);
    setEndCoords(ec);
    setShowSheet(true);
  }

  return (
    <>
      {activeTrip ? (
        <button
          onClick={handleStop}
          disabled={stopping}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60"
          style={{ background: "#D83A3A", boxShadow: "0 2px 8px rgba(216,58,58,.35)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {stopping ? "Locating…" : `Stop · ${formatElapsed(elapsed)}`}
        </button>
      ) : (
        <button
          onClick={startTrip}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Timer size={13} />
          Start Trip
        </button>
      )}

      {showSheet && (
        <LogTripSheet
          boatId={boatId}
          prefillStartedAt={startedAt}
          prefillStartCoords={startCoords}
          prefillEndCoords={endCoords}
          onClose={() => setShowSheet(false)}
          onSaved={() => {
            setShowSheet(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
