"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getQueue, dequeue } from "@/lib/offline-queue";
import { useOnlineStatus } from "@/hooks/use-online-status";

type OfflineSyncContextValue = {
  pendingCount: number;
  syncing: boolean;
  refreshPendingCount: () => void;
};

const OfflineSyncContext = createContext<OfflineSyncContextValue>({
  pendingCount: 0,
  syncing: false,
  refreshPendingCount: () => {},
});

export function useOfflineSync() {
  return useContext(OfflineSyncContext);
}

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getQueue().length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!isOnline) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    syncedRef.current = true;
    setSyncing(true);

    fetch("/api/offline-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queue),
    })
      .then((r) => r.json())
      .then((data: { results: { id: string; ok: boolean }[] }) => {
        for (const r of data.results) {
          if (r.ok) dequeue(r.id);
        }
        refreshPendingCount();
      })
      .catch(() => {
        syncedRef.current = false;
      })
      .finally(() => {
        setSyncing(false);
        refreshPendingCount();
      });
  }, [isOnline, refreshPendingCount]);

  return (
    <OfflineSyncContext.Provider value={{ pendingCount, syncing, refreshPendingCount }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}
