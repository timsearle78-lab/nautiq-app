"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nautiq_active_trip";

export type ActiveTrip = {
  boatId: string;
  startedAt: string; // ISO string
};

export function useTripTimer(boatId: string) {
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ActiveTrip = JSON.parse(raw);
        if (parsed.boatId === boatId) setActiveTrip(parsed);
      }
    } catch {}
  }, [boatId]);

  // Tick elapsed seconds while trip is active
  useEffect(() => {
    if (!activeTrip) { setElapsed(0); return; }
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(activeTrip.startedAt).getTime()) / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeTrip]);

  const startTrip = useCallback(() => {
    const trip: ActiveTrip = { boatId, startedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    setActiveTrip(trip);
  }, [boatId]);

  const stopTrip = useCallback(() => {
    const trip = activeTrip;
    localStorage.removeItem(STORAGE_KEY);
    setActiveTrip(null);
    setElapsed(0);
    return trip;
  }, [activeTrip]);

  return { activeTrip, elapsed, startTrip, stopTrip };
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
