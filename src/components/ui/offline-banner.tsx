"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useOfflineSync } from "@/components/providers/offline-sync-provider";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncing } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all ${
        isOnline ? "bg-amber-500" : "bg-slate-700"
      }`}
    >
      {isOnline ? (
        <>
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Syncing {pendingCount} offline {pendingCount === 1 ? "entry" : "entries"}…
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          You&apos;re offline — watch items, inventory and maintenance entries will sync when reconnected
        </>
      )}
    </div>
  );
}
