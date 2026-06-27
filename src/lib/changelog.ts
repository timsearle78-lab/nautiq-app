export type Release = {
  date: string; // YYYY-MM-DD — used to track "last seen" in localStorage
  label: string; // e.g. "June 2026 update"
  features: string[];
};

// Add new entries at the TOP. The first entry is always treated as the latest.
export const CHANGELOG: Release[] = [
  {
    date: "2026-06-27",
    label: "June 2026 update",
    features: [
      "Download a full Boat Report as a PDF — from the Profile tab or by asking the AI",
      "Start/Stop trip timer is now on the Home screen, next to Log Maintenance",
      "Smooth toggle switch to filter low-stock items on the Inventory page",
      "Spinning NautIQ logo while the AI is thinking, scanning, or saving",
      "Reset chat button (↺) to clear the conversation and start fresh",
      "Scroll-to-top button appears on any long page after scrolling down",
      "Components table removed from Maintenance Overview — use the All Components button instead",
      "All primary buttons now use a consistent ocean-blue gradient",
    ],
  },
];

export const LATEST_RELEASE = CHANGELOG[0];
export const SEEN_KEY = "nautiq_seen_release";
