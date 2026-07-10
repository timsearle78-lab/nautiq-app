export type Release = {
  date: string; // YYYY-MM-DD — used to track "last seen" in localStorage
  label: string; // e.g. "June 2026 update"
  features: string[];
};

// Add new entries at the TOP. The first entry is always treated as the latest.
export const CHANGELOG: Release[] = [
  {
    date: "2026-07-01",
    label: "July 2026 update",
    features: [
      "Boat specs — capture propulsion, hull design, and hull material during setup and in Settings",
      "Component suggestions now tailored to your boat's propulsion and hull material (e.g. electric motor checks for electric boats, wood hull caulking for wooden vessels)",
      "Dimensions (length, beam, draft) can now be saved against each boat in Settings",
      "Delete a boat and all its data from the Danger Zone in Settings — requires typing the boat name to confirm",
      "Boat description field in Settings — describe your boat in plain English and the AI will use it to suggest the right components and give better maintenance advice",
    ],
  },
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
      "AI assistant now stays focused on your boat — off-topic questions are politely declined",
      "Friendlier error message if something goes wrong in the chat",
      "Maintenance gap suggestions on the Home screen — see what components are missing for your boat type",
      "Home screen simplified — quick actions moved to a hamburger menu (☰) to give more space to the chat",
      "Hamburger menu (☰) now works on every page, not just the home screen",
      "Scan item now lets you choose between taking a photo or picking from your device",
      "Stay signed in option on the login page — keeps you logged in on your device securely",
      "GPS location captured automatically when you start and stop a trip — tap coordinates to view on a map",
    ],
  },
];

export const LATEST_RELEASE = CHANGELOG[0];
export const SEEN_KEY = "nautiq_seen_release";
