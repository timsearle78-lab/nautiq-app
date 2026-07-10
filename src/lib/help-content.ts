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
- Home (Chat): Your AI assistant. Ask questions, log trips by voice, update inventory, get maintenance reminders, and download a boat report.
- Trips: A log of every time you've been out on the water, with engine hours and fuel tracking.
- Maintain: An overview of all your boat's components and their service status. Tells you what's overdue, due soon, or healthy.
- Inventory: A list of all your spare parts and supplies, with stock levels and low-stock alerts.
- Profile: Account settings, boat details, boat report PDF download, and this help guide.`,
  },
  {
    id: "boat",
    title: "How to add or edit a boat",
    content: `When you first sign up, NautIQ walks you through adding your boat with a setup wizard. It will ask for your boat's name, type, propulsion, hull design, and hull material — then automatically create common systems and components for that type of vessel.

To add another boat or edit an existing one:
1. Tap the Profile tab (bottom right).
2. Tap Settings.
3. Scroll to your boat — you can edit the name, type, propulsion, hull design, hull material, and dimensions (length, beam, draft). You can also upload a photo.
4. To add a new boat, scroll to the bottom of the Settings page and use the "Add boat" section.
5. You can switch between boats using the boat selector in the top-right corner of the app.

Boat specs are used to tailor component suggestions on the Home screen. For example, an electric boat will be prompted to add a drive battery pack and BMS, while a wooden boat will see hull caulking suggestions.

There is also a free-text Boat description field — describe your boat in plain English (builder, year, engine make/model, sails, electronics, any quirks). The AI assistant reads this description in every conversation, so the more detail you add, the better its maintenance advice and component suggestions will be.`,
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

Each component has a service interval defined in time (months/years) and/or engine hours. NautIQ uses a predictive timeline to estimate when each component will next be due based on your average usage, and shows you:
- Overdue: past the service interval — needs attention now.
- Due soon: within 85% of the interval — plan for service.
- Healthy: well within the interval.

To log maintenance:
1. Go to the Maintain tab and tap a component, or go directly to a component's page from anywhere in the app.
2. Tap the "Log Maintenance" button at the top of the component page.
3. Fill in the date, work done, engine hours at the time of service, vendor, and any notes. You can also mark a spare part as consumed.
4. Tap "Save maintenance record."

You can also tap "+ Log Maintenance" on the Home screen to log maintenance without navigating to the component page first — just pick the component from the dropdown.

After logging, the component's health score resets and the next due date is recalculated.

The Maintenance Overview shows all components sorted by urgency. Use the "All Components" button to see the full component list.

Maintenance gap suggestions: When you open the Home screen, NautIQ checks your component list against a typical maintenance schedule for your boat type. If anything important is missing, a yellow suggestion card appears — tap it to see what components are worth adding and why. Tap "Add" next to any suggestion to go straight to the add component form.`,
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

To filter to low-stock items only, use the "Low stock only" toggle at the top of the Inventory page. It applies instantly — no need to tap Apply.

To add an item manually:
1. Go to the Inventory tab and tap "+ Add item."
2. Fill in the name, quantity, unit (ea, L, kg, etc.), category, and optionally link it to a maintenance component.
3. Mark it as a critical spare if it's essential for safety or operation.

To scan an item:
1. Open the ☰ menu and tap "Scan item."
2. Choose "Take photo" to use your camera, or "Choose from device" to pick an existing image.
3. The AI will identify the item and pre-fill the form. If a similar item already exists in your inventory, it will offer to update the existing item's quantity instead of creating a duplicate.

To adjust stock (used or restocked a part):
- On any inventory item's page, tap "+ Add" or "Use" to update the quantity.
- You can also say to the AI: "I used 2 oil filters" or "I bought a new impeller."
- Tap "Restock item" or "Used item" below the chat box for a quick shortcut.

Linking spares to components: When a spare is linked to a component, low stock for that spare increases the component's risk score — so you'll be reminded to restock before you need to service it.

Expiry dates: You can record an expiry date on any inventory item (e.g. flares, first aid supplies, epoxy, fuel treatment). Items expiring within 90 days show an amber "Exp. Xd" badge; expired items show a red "Expired" badge. The Inventory page shows an "Expiring soon" tile so you can see at a glance how many items need attention. Expired and near-expired critical items also increase your boat's health risk score.`,
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
- "Send me a boat report" or "Download a PDF summary" → generates and downloads a full boat report PDF.
- "How do I log maintenance?" → answers how-to questions about the app.

Quick actions menu: tap the ☰ button (top left of the chat screen) to open a menu with:
- Start/Stop trip timer
- Log Trip
- Log Maintenance
- Scan item: tap "Scan item," then choose to take a photo or pick from your device to identify and add a part to inventory.
- Restock item: quickly log that you bought new parts.
- Used item: quickly log that you consumed a spare.
- New chat: clear the conversation and start fresh (appears when there are messages).

To reset the conversation, open the ☰ menu and tap "New chat". This clears the current chat without deleting any saved data.

The assistant only helps with questions about your boat, maintenance, inventory, trips, and the NautIQ app. Off-topic questions will be politely declined.

Voice notes: Every notes field in the app has a microphone button — tap it to dictate your notes hands-free.

When the AI is processing your request, a spinning NautIQ logo will appear so you know it's working.`,
  },
  {
    id: "report",
    title: "Boat Report PDF",
    content: `NautIQ can generate a full PDF summary of your boat, including:
- Boat name and type
- Overall health score
- Engine hours
- Maintenance schedule (all components with their status)
- Full inventory list (low-stock items highlighted)
- Last 10 trips

To download a report:
1. Go to the Profile tab and tap "Download Boat Report."
2. Or, in the Home chat, say "Download a boat report" or "Send me a PDF summary."

The PDF is generated on your device and saved automatically to your downloads folder.`,
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
  {
    id: "navigation",
    title: "App navigation tips",
    content: `A few handy navigation features:

Scroll to top: On any long page, after scrolling down a short way, a scroll-to-top button appears at the bottom centre of the screen. Tap it to jump back to the top.

What's New: When NautIQ releases new features, a notification card appears at the top of the Home screen the next time you open the app. Tap "Got it — dismiss" to hide it.

Page loading: When the app is loading a new page or saving a record, a spinning NautIQ logo will appear in the centre of the screen so you know it's working.

Bottom navigation: The five tabs at the bottom of the screen take you to Home, Trips, Maintain, Inventory, and Profile. The Profile tab gives access to settings, the boat report, and this help guide.`,
  },
];

// Compact version injected into the AI chat system prompt.
export const HELP_SYSTEM_PROMPT = `
APP USAGE GUIDE (answer "how do I" questions using this):

OVERVIEW: NautIQ has 5 sections — Home/Chat (AI assistant), Trips (engine hours log), Maintain (component service tracking), Inventory (spare parts), Profile (settings/help/report).

BOAT SETUP: First-time wizard asks for name, type, propulsion, hull design, hull material, and an optional free-text description — then creates systems and components automatically. Edit boat specs (including dimensions: length, beam, draft) and description in Profile → Settings. Add more boats in Profile → Settings. Switch boats via the top-right selector. Boat specs and description refine component suggestions and AI advice.

LOGGING A TRIP: (1) Start/Stop timer on Home screen — tap "Start Trip" when leaving (GPS location captured), "Stop Trip" when back (GPS location captured again); (2) "+ Log Trip" button on Home; (3) tell the AI "went sailing for 3 hours."

MAINTENANCE: Each component has a time/engine-hour service interval. NautIQ uses a predictive timeline to estimate due dates based on average usage. Risk score shows overdue/due soon/healthy. Log maintenance via "Log Maintenance" button on the component page or from the Home screen. Fill in date, work done, engine hours, optional spare consumed. The Maintenance Overview shows components sorted by urgency; use "All Components" for the full list. On the Home screen, a yellow card suggests components typical for your boat type that you haven't added yet — tap "Add" on any suggestion to add it.

COMPONENTS & SYSTEMS: Components = individual parts needing service (engine, impeller, life jackets…). Systems = groups (Engine, Safety, Electrical…). Add/edit from Maintain tab. Delete from Danger Zone on component page.

INVENTORY: Add items via "+ Add item" or camera "Scan item" on Home. Adjust stock by saying "I used X" or "I bought X" to the AI, or via the Restock item / Used item chips, or from the item's page. Use the "Low stock only" toggle on the Inventory page to filter instantly. Link spares to components so low stock raises the risk score. Set an expiry date on items like flares, first aid supplies, or fuel treatment — items expiring within 90 days show an amber badge; expired items show red. The "Expiring soon" tile on the Inventory page shows the count at a glance. Expired critical items increase the boat health risk score.

BOAT REPORT / PDF: Say "download a boat report" or "send me a PDF summary" to generate and download a full PDF of health, maintenance schedule, inventory, and recent trips. Also available from Profile tab → "Download Boat Report."

HEALTH SCORE: 0–100. Drops as components go overdue, spares run low, or inventory expires. Shown on the Home screen and in the header. Tap the score to open the Boat Health page — it explains exactly why the score is what it is, lists overdue maintenance, due-soon items, and inventory issues, and gives a specific recommendation for each item to restore the score to 100.

VOICE: Every notes field has a mic button. The main mic button on Home sends voice messages to the AI.

CHAT RESET: Open the ☰ menu (top left) and tap "New chat" to clear the current conversation and start fresh.

SCOPE: Only answer questions about this boat, maintenance, trips, inventory, and the NautIQ app. For anything else reply: "Sorry, I can only help with questions about your boat and the NautIQ app."

NAVIGATION: Scroll-to-top button appears at the bottom centre of the screen on any long page after scrolling down. What's New card appears in chat when new features are released.

SIGN IN: On the login page there is a "Stay signed in on this device" toggle (on by default). When enabled, your session persists across browser closes so you don't need to log in each time. Turn it off on shared or public devices.
`.trim();
