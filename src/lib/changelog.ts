export type Release = {
  date: string; // YYYY-MM-DD — used to track "last seen" in localStorage
  label: string; // e.g. "June 2026 update"
  features: string[];
};

// Add new entries at the TOP. The first entry is always treated as the latest.
export const CHANGELOG: Release[] = [
  {
    date: "2026-08-26",
    label: "August 2026 update",
    features: [
      "Fresh new look — the app has been redesigned with a cleaner, bolder visual style: clearer status colours, sharper typography, and a tidier layout throughout",
    ],
  },
  {
    date: "2026-08-21",
    label: "August 2026 update",
    features: [
      "Getting started tips — if you haven't logged a trip or added spare parts yet, the home screen now shows friendly prompt cards to help you get the most out of NautIQ",
    ],
  },
  {
    date: "2026-08-16",
    label: "August 2026 update",
    features: [
      "Smarter health dashboard — the Home screen now shows critical inventory shortfalls (e.g. low diesel, missing spares) as warning tiles alongside overdue maintenance, so any issue affecting your boat's health score is visible at a glance",
      "Fuel used display — trip forms and trip history now correctly label fuel as 'Fuel used' and inventory history shows deductions as '− Used' rather than '+ Added'",
      "Faster page loads — pages now fetch data in parallel and show animated skeletons while loading instead of a blank screen",
    ],
  },
  {
    date: "2026-08-13",
    label: "August 2026 update",
    features: [
      "Edit trips, maintenance records, and inventory items — tap the pencil icon next to any row to update details in a quick-edit form",
      "Hide the Personal Boat Assistant greeting card — go to Settings → Appearance to turn it off if you prefer a cleaner Home screen",
      "Hide the What's New card — go to Settings → Appearance to stop release notes appearing on the Home page",
      "Automatic fuel estimation — set a fuel consumption rate (litres/hour) on your boat in Settings, and fuel used will be calculated and deducted from inventory automatically when you log a trip without entering fuel manually",
    ],
  },
  {
    date: "2026-08-12",
    label: "August 2026 update",
    features: [
      "Log maintenance by chat — just tell the AI what you did (\"I did an oil change\") and a pre-filled maintenance record appears for you to review and save",
      "Personalised welcome greeting — your PBA greets you each time you open the app with a summary of recent activity, maintenance encouragement, and reminders",
      "Cost tracking — log what you spend on maintenance and parts, then see your total cost of ownership by year in the new Cost tracker (Profile → Cost tracker)",
      "Inventory improvements — creating a new item now captures minimum stock level and critical-safety flag; vendor is now saved when logging maintenance via chat",
    ],
  },
  {
    date: "2026-08-10",
    label: "August 2026 update",
    features: [
      "Dark mode — switch between Light and Dark in Settings → Appearance for comfortable use at night or in low light",
    ],
  },
  {
    date: "2026-08-07",
    label: "August 2026 update",
    features: [
      "Privacy Policy and Terms of Service now accessible from the Profile sheet and sign-in screens",
      "Improved error handling — unexpected errors are caught gracefully and reported automatically",
      "Reset your password directly from Settings → Account",
      "Log trips by email — send trip details to log@nautiq.cloud and a draft appears in the chat to review and save",
    ],
  },
  {
    date: "2026-08-06",
    label: "August 2026 update",
    features: [
      "Email your maintenance logs to log@nautiq.cloud — NautIQ reads the email, extracts the details, and has a pre-filled maintenance record ready when you next open the app",
      "Boat Report PDF now includes a full Maintenance History section (last 50 records)",
      "What's New release notes now available in the Profile sheet — tap your avatar to see the full history",
    ],
  },
  {
    date: "2026-08-05",
    label: "August 2026 update",
    features: [
      "Attach photos to maintenance records — use your camera or choose from your library (up to 3 photos per entry)",
      "Photos appear as thumbnails in the maintenance history and can be tapped to view full size",
      "Delete maintenance records directly from the component page — with a confirm step to avoid accidents",
      "Boat health score now degrades faster the longer a component is overdue — a component 2× past its service interval hurts the score significantly more than one just past due",
      "Delete trips from the Trips page with inline confirmation",
    ],
  },
  {
    date: "2026-07-29",
    label: "July 2026 update",
    features: [
      "Tap any inventory stat tile (Low stock, Critical missing, Stocked, Expiring soon) to instantly filter the list — tap again to clear",
      "Scan any item with your camera — AI identifies it, matches it to your existing inventory, and lets you add to the count or create a new item in one step",
      "Fixed an issue on some desktop browsers where menus and quick-action buttons weren't responding to clicks",
    ],
  },
  {
    date: "2026-07-10",
    label: "July 2026 update",
    features: [
      "Email notifications — get a daily or weekly boat health summary and instant alerts when a component becomes overdue (configure in Settings → Notifications)",
      "Tap the health score (in the header or on the Home screen) to see a full breakdown of why your score is what it is, with specific recommendations to restore it to 100",
      "Expiry dates on inventory items — get warned in-line when items are expired or expiring within 90 days",
      "Expiring soon tile on the Inventory page shows how many items need attention at a glance",
      "Critical low-stock and expired items now carry higher penalties in the boat health score",
    ],
  },
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
