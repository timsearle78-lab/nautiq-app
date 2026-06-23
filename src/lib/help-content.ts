// Single source of truth for app help content.
// Used by both the Help page UI and the AI chat system prompt.

export type HelpSection = {
  id: string;
  title: string;
  content: string; // plain text paragraphs / bullet lines
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "overview",
    title: "What is NautIQ?",
    content: `NautIQ is a boat management app that helps you stay on top of maintenance, track your time on the water, and manage your spare parts — all in one place.

The app has five main areas:
- Home (Chat): Your AI assistant. Ask questions, log trips by voice, update inventory, and get maintenance reminders.
- Trips: A log of every time you've been out on the water, with engine hours and fuel tracking.
- Maintain: An overview of all your boat's components and their service status. Tells you what's overdue, due soon, or healthy.
- Inventory: A list of all your spare parts and supplies, with stock levels and low-stock alerts.
- Profile: Account settings, boat details, and this help guide.`,
  },
  {
    id: "boat",
    title: "How to add or edit a boat",
    content: `When you first sign up, NautIQ walks you through adding your boat with a setup wizard. It will ask for your boat's name and type, then automatically create common systems and components for that type of vessel.

To add another boat or edit an existing one:
1. Tap the Profile tab (bottom right).
2. Tap Settings.
3. Scroll to your boat — you can edit the name, type, and upload a photo.
4. To add a new boat, scroll to the bottom of the Settings page and use the "Add boat" section.
5. You can switch between boats using the boat selector in the top-right corner of the app.`,
  },
  {
    id: "trips",
    title: "How to log a trip",
    content: `There are three ways to log a trip:

1. Start/Stop timer (recommended): On the Home screen, tap "Start Trip" when you leave the marina. When you return, tap "Stop Trip" — this opens the trip form with your departure time already filled in. Just add engine hours, fuel, and notes.

2. Log Trip button: Tap "+ Log Trip" on the Home screen to open the form manually. Fill in the date, departure and return times, engine hours used, and any fuel added.

3. Talk to the AI: On the Home screen, type or say something like "I went sailing for 3 hours today" or "motored 2.5 hours, added 40 litres of fuel." The AI will parse your description and show a trip card for you to confirm before saving.

Engine hours are required for every trip — they're used to calculate when maintenance is due.`,
  },
  {
    id: "maintenance",
    title: "How maintenance tracking works",
    content: `NautIQ tracks service intervals for every component on your boat (engine, impeller, belts, safety gear, etc.).

Each component has a service interval defined in time (months/years) and/or engine hours. NautIQ calculates a risk score based on how overdue the component is and shows you:
- Overdue: past the service interval — needs attention now.
- Due soon: within 85% of the interval — plan for service.
- Healthy: well within the interval.

To log maintenance:
1. Go to the Maintain tab and tap a component, or go directly to a component's page from anywhere in the app.
2. Tap the "Log Maintenance" button at the top of the component page.
3. Fill in the date, work done, engine hours at the time of service, vendor, and any notes. You can also mark a spare part as consumed.
4. Tap "Save maintenance record."

You can also tap "+ Log Maintenance" on the Home screen to log maintenance without navigating to the component page first — just pick the component from the dropdown.

After logging, the component's health score resets and the next due date is recalculated.`,
  },
  {
    id: "components",
    title: "What are components and systems?",
    content: `Components are the individual parts of your boat that need regular maintenance — for example: engine, impeller, raw water pump, standing rigging, life jackets, fire extinguishers, bilge pump.

Systems are groups of components — for example: Engine, Safety, Electrical, Plumbing, Rigging.

When you set up your boat, NautIQ creates a default set of systems and components based on your boat type. You can:
- Add new components from the Maintain tab → "Add component."
- Edit a component (name, service intervals, notes) by tapping it and scrolling to the edit form.
- Delete a component from the Danger Zone at the bottom of the component page.
- Add or remove systems from Profile → Settings → Systems.

Each component has a service interval (time-based and/or engine-hour-based). NautIQ uses your trip engine hours to track hours since last service.`,
  },
  {
    id: "inventory",
    title: "How to manage spare parts (inventory)",
    content: `The Inventory tab shows all your spare parts and supplies. Each item has a current quantity and an optional minimum quantity — when stock drops below the minimum, it shows as low stock.

To add an item manually:
1. Go to the Inventory tab and tap "+ Add item."
2. Fill in the name, quantity, unit (ea, L, kg, etc.), category, and optionally link it to a maintenance component.
3. Mark it as a critical spare if it's essential for safety or operation.

To scan an item with your camera:
1. On the Home screen, tap "Scan item."
2. Point your camera at the product label or packaging.
3. The AI will identify the item and pre-fill the form. If a similar item already exists in your inventory, it will offer to update the existing item's quantity instead of creating a duplicate.

To adjust stock (used or restocked a part):
- On any inventory item's page, tap "+ Add" or "Use" to update the quantity.
- You can also say to the AI: "I used 2 oil filters" or "I bought a new impeller."

Linking spares to components: When a spare is linked to a component, low stock for that spare increases the component's risk score — so you'll be reminded to restock before you need to service it.`,
  },
  {
    id: "chat",
    title: "How to use the AI assistant",
    content: `The Home screen is your AI assistant. You can type or speak to it — tap the microphone button to use your voice.

Things you can ask or say:
- "What maintenance is due?" → shows overdue and upcoming service items.
- "How's the boat doing?" → shows the overall health score and urgent items.
- "What spares am I low on?" → shows your inventory status.
- "I went sailing for 3 hours today" → logs a trip (AI parses your words).
- "I used a fuel filter" → adjusts inventory (AI finds the item and asks you to confirm).
- "I bought 2 new impellers" → adds to inventory stock.
- "How do I log maintenance?" → answers how-to questions about the app.

Quick action chips below the chat box let you scan parts, log bought/used parts, or start/stop the trip timer with one tap.

Voice notes: Every notes field in the app has a microphone button — tap it to dictate your notes hands-free.`,
  },
  {
    id: "health",
    title: "Understanding the health score",
    content: `The health score (0–100) represents the overall condition of your boat's maintenance. A score of 100 means everything is within service intervals and well-stocked. The score drops as components approach or exceed their service intervals, or when linked spare parts run low.

How the score is calculated:
- Each component gets a risk score based on how far through its service interval it is (time and/or engine hours), plus a penalty if linked spares are low (out of stock: +25, below minimum: +15, at minimum: +5).
- The boat health score is 100 minus the average component risk score.

The score and breakdown are shown on the Home screen and in the health banner at the top of the chat.`,
  },
];

// Compact version injected into the AI chat system prompt.
export const HELP_SYSTEM_PROMPT = `
APP USAGE GUIDE (answer "how do I" questions using this):

OVERVIEW: NautIQ has 5 sections — Home/Chat (AI assistant), Trips (engine hours log), Maintain (component service tracking), Inventory (spare parts), Profile (settings/help).

BOAT SETUP: First-time wizard creates systems and components automatically. Add more boats in Profile → Settings. Switch boats via the top-right selector.

LOGGING A TRIP: (1) Start/Stop timer on Home screen — tap "Start Trip" when leaving, "Stop Trip" when back; (2) "+ Log Trip" button on Home; (3) tell the AI "went sailing for 3 hours."

MAINTENANCE: Each component has a time/engine-hour service interval. Risk score shows overdue/due soon/healthy. Log maintenance via "Log Maintenance" button on the component page or from the Home screen. Fill in date, work done, engine hours, optional spare consumed.

COMPONENTS & SYSTEMS: Components = individual parts needing service (engine, impeller, life jackets…). Systems = groups (Engine, Safety, Electrical…). Add/edit from Maintain tab. Delete from Danger Zone on component page.

INVENTORY: Add items via "+ Add item" or camera "Scan item" on Home. Adjust stock by saying "I used X" or "I bought X" to the AI, or from the item's page. Link spares to components so low stock raises the risk score.

HEALTH SCORE: 0–100. Drops as components go overdue or spares run low. Shown on Home screen.

VOICE: Every notes field has a mic button. The main mic button on Home sends voice messages to the AI.
`.trim();
