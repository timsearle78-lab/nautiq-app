export type OfflineQueueItem = {
  id: string;
  type: "watch-item" | "inventory-item" | "maintenance" | "checkin" | "trip";
  payload: Record<string, string | number | boolean | null>;
  createdAt: string;
};

const STORAGE_KEY = "nautiq_offline_queue";

export function getQueue(): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function enqueue(item: Omit<OfflineQueueItem, "id" | "createdAt">): void {
  try {
    const queue = getQueue();
    queue.push({ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage unavailable — silent failure
  }
}

export function dequeue(id: string): void {
  try {
    const queue = getQueue().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
