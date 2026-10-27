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
    content: `NautIQ is a boat management app that helps you stay on top of maintenance, track your time on the water, and manage everything on board — all in one place.

The app has five main areas:
- Home (Chat): Your AI assistant. Ask questions, log trips by voice, update inventory, get maintenance reminders, and download a boat report.
- Trips: A log of every time you've been out on the water, with engine hours and fuel tracking.
- Maintain: An overview of all your boat's components and their service status. Tells you what's overdue, due soon, or healthy.
- Inventory: A register of everything on board — spare parts, safety equipment, consumables, tools, and gear — with stock levels and expiry tracking.
- Profile: Account settings, boat details, boat report PDF download, and this help guide.`,
  },
  {
    id: "settings",
    title: "Settings overview",
    content: `Settings are reached via the Profile tab (bottom right) → Settings. The Settings page is divided into five sections: Your boats, Systems, Appearance, Notifications, and Account.

Appearance: Switch between Light mode and Dark mode. Dark mode uses a deep navy colour scheme optimised for night-time or low-light use on the water. Your preference is saved and applied automatically on every visit.

Personal Boat Assistant: The greeting card that appears at the top of the Home screen can be hidden. Go to Settings → Appearance and set "Personal Boat Assistant" to Hide. Tap Show to bring it back.

What's New card: The release notes card that appears when the app is updated can be hidden. Go to Settings → Appearance and set "What's New card" to Hide.

Sign up / email verification: When you create a new account, a 6-digit code is emailed to you. Enter it on the "Check your email" screen to activate your account. If the code doesn't arrive, tap "Resend code". Once verified you'll be taken to the login screen.

Reset password: Go to Settings → Account → Reset password. A 6-digit code will be emailed to your account address. Open the link in the email, enter the code, choose your new password, and tap Update password — all on one screen.

If you've forgotten your password at the sign-in screen, tap "Forgot password?" and follow the same steps.`,
  },
  {
    id: "boat",
    title: "How to add or edit a boat",
    content: `When you first sign up, NautIQ walks you through adding your boat with a setup wizard. It will ask for your boat's name, type, propulsion, hull design, and hull material — then automatically create common systems and components for that type of vessel.

To edit an existing boat:
1. Go to Profile → Settings.
2. Find your boat in the list and tap the "Edit" button next to it.
3. A slide-up form opens where you can update any of these:
   - Name (required)
   - Type: Motorboat, Keeler Yacht, Trailer Yacht, Catamaran, RIB, Other
   - Propulsion: Inboard diesel, Inboard petrol, Outboard, Sail, Sail + auxiliary, Electric, Hybrid
   - Hull design: Monohull, Catamaran, Trimaran, Pontoon, Semi-displacement, Planing, Displacement
   - Hull material: Fibreglass (GRP), Aluminium, Steel, Wood, Carbon fibre, Ferro-cement, Inflatable (Hypalon/PVC)
   - Dimensions: Length (LOA), Beam, Draft — in metres
   - Consumption rate (L/hr): used to estimate fuel used per trip automatically
   - Tank capacity (litres): used to show your fuel level gauge
   - Engine meter reading (hours): your starting engine meter total — NautIQ adds logged trip hours on top of this to calculate your running cumulative total
   - Boat photo: tap "Upload photo" to add a circular avatar image (JPG, PNG or WebP)
   - Boat description (optional): free-text field — describe your boat in plain English (builder, year, engine make/model, sails, electronics, any quirks). The AI reads this in every conversation to give better advice.
4. Tap "Save changes."

The edit form also lets you manage crew and systems for that boat — scroll down past the form to find Co-owners and Systems sections.

To add a second boat:
1. Go to Profile → Settings.
2. Tap "Add boat" in the top-right of the Your boats section.
3. Fill in the name and type, then tap "Add boat." Default systems and components are created automatically.
4. Switch between boats using the boat selector in the top-right corner of the app.

To delete a boat:
1. Find your boat in Settings → Your boats and tap the red trash icon next to it.
2. A confirmation dialog appears — type the exact boat name to enable the delete button.
3. This removes all maintenance records, components, systems, trips, and inventory for that boat. It cannot be undone.`,
  },
  {
    id: "trips",
    title: "How to log a trip",
    content: `There are three ways to log a trip:

1. Start/Stop timer (recommended): On the Home screen, tap "Start Trip" when you leave the marina. When you return, tap "Stop Trip" — this opens the trip form with your departure time already filled in. Just add engine hours, fuel, and notes.

2. Log Trip button: Tap "+ Log Trip" on the Home screen to open the form manually. Fill in the date, departure and return times, engine hours used, and any fuel added.

3. Talk to the AI: On the Home screen, type or say something like "I went sailing for 3 hours today" or "motored 2.5 hours, added 40 litres of fuel." The AI will parse your description and show a trip card for you to confirm before saving.

Engine hours are required for every trip — they're used to calculate when maintenance is due. You can enter engine hours in two ways:
- "Hours on trip" (default): Enter the number of hours you ran the engine on this trip only (e.g. 2.5).
- "Engine meter": Enter your current engine meter (odometer) reading. NautIQ will look up your previous total and calculate the hours for this trip automatically. Useful if you record your meter reading at the end of each trip.

Engine meter starting point: For the Engine meter mode to give an accurate cumulative total, set your starting point in Settings → Your boats → Edit → "Engine meter reading." If this hasn't been set, a yellow warning will appear in the trip form when you enter engine hours — tap the link to go straight to Settings and enter it. You can also set it during the onboarding wizard when you first set up the app (Step 4: Fuel & engine hours).

Automatic fuel estimation: If you leave the Fuel field blank but enter engine hours, NautIQ can calculate fuel used automatically. Go to Settings → Your boats → edit your boat, and set a "Fuel consumption" rate in litres per hour (e.g. 8.5 for a typical diesel). Once set, any trip saved without manual fuel entry will have fuel estimated from hours × rate, and that amount will be deducted from your fuel inventory automatically.

Trip photos: You can attach up to 3 photos to any trip when logging it — tap Camera to take a photo or Choose to select from your device (including multiple images at once from your gallery). HEIC photos from iPhone are supported. Photos appear as small thumbnails on the trip in the Trips list; tap any thumbnail to view it full size.

To edit or delete a trip: Go to the Trips page, find the trip in the list, and tap the pencil icon to edit it. You can change the dates, times, engine hours, fuel, and notes. Tap the bin icon to delete a trip.`,
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
3. Fill in the date, work done, engine hours at the time of service, vendor, and any notes. You can also mark an inventory item as consumed.
4. Optionally attach up to 3 photos — tap "Camera" to take a photo or "Choose" to pick from your device's library. Thumbnails appear in the form and can be removed before saving.
5. Tap "Save maintenance record." Photos are uploaded automatically after the record is saved.

You can also tap "+ Log Maintenance" on the Home screen to log maintenance without navigating to the component page first — just pick the component from the dropdown.

To edit a maintenance record: Go to a component's page, scroll to Maintenance history, and tap the pencil icon next to any record. You can update the date, work done, engine hours, vendor, cost, and notes.

"Do not reset service interval" option: When logging or editing a maintenance record, you can tick "Do not reset service interval." This saves the record for reference but does NOT update the component's last-service date or recalculate when the next service is due. Use it for minor checks, inspections, or informational entries where you haven't actually performed the full service.

After logging (without the "Do not reset" option ticked), the component's health score resets and the next due date is recalculated.

Email to log: You can also email your maintenance notes to log@nautiq.cloud from the email address registered to your account. NautIQ reads the email, uses AI to extract the component, work done, date, engine hours, vendor, and notes, then presents a pre-filled maintenance record on your Home screen the next time you open the app. Just tap "Complete maintenance record" to review and save it. The draft can be dismissed with the X button if you don't want to save it.

Purchase emails: Forward a receipt, invoice, parts order, or chandlery purchase to log@nautiq.cloud and NautIQ will parse the items. A "Purchase email received" card will appear on your Home screen listing each item with quantity and price. Items that match something already in your inventory are highlighted in green — tapping "Add to inventory" will top up their stock. Unrecognised items are created as new inventory entries. Toggle individual items off to skip them before saving.

To delete a maintenance record, go to the component page, find the record in the maintenance history table, and tap the trash icon. Confirm by tapping "Yes" in the inline confirmation.

Photos attached to a maintenance record appear as small thumbnails in the history table — tap any thumbnail to open the full-size image.

The Maintenance Overview shows all components sorted by urgency. Use the "All Components" button to see the full component list.

Maintenance gap suggestions: When you open the Home screen, NautIQ checks your component list against a typical maintenance schedule for your boat type. If anything important is missing, a yellow suggestion card appears — tap it to see what components are worth adding and why. Tap "Add" next to any suggestion to go straight to the add component form.`,
  },
  {
    id: "watch-list",
    title: "Using the Watch List",
    content: `The Watch List is on the Maintenance page. It's for tracking anything that needs attention but isn't a full maintenance job yet — wear and tear, something to keep an eye on, a reminder to sort something later.

To add a watch item:
1. Go to the Maintenance page and tap "Add" in the Watch List section, OR
2. Tap "Watch item" in the Quick Actions menu (☰ icon, top left), OR
3. Tap the "Watch list" button on the Home screen.

You can also log a marina or anchorage visit directly from the Home screen using the "Log visit" shortcut button (green chip, below the assistant prompt).

Fill in:
- What needs attention (required) — e.g. "Safety line lashing wearing thin"
- Component (optional) — link it to a specific component on your boat
- Notes (optional) — any extra detail
- Photos (optional) — up to 3 photos; tap Camera to take one or Choose to pick from your library

When you're ready to deal with it:
1. Tap "Mark done" on the watch item card.
2. A maintenance log form opens, pre-filled with the watch item's title and component.
3. Add the date, work done, engine hours, and any notes.
4. Tap "Mark done & log maintenance" — the watch item is resolved and a maintenance record is created.

To remove a watch item without logging maintenance, tap "Delete."`,
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

When adding a component, the System field is a searchable combobox. You can pick an existing system or type a new name and choose "Add as new system." NautIQ checks for similar names (e.g. plurals) and will warn you if one already exists so you don't create a duplicate.

To manage systems:
1. Go to Profile → Settings → Your boats.
2. Tap the "Edit" button next to the boat whose systems you want to manage.
3. Scroll to the bottom of the edit form — the Systems section is there.
4. Each existing system has a trash icon — tap it and confirm to delete the system.
5. To add a new system, type its name (e.g. "Engine," "Electrical," "Deck") in the text field and tap "Add."

Each component has a service interval (time-based and/or engine-hour-based). NautIQ uses your trip engine hours to track hours since last service.`,
  },
  {
    id: "notifications",
    title: "How to set up email notifications",
    content: `NautIQ can send you email alerts about your boat's maintenance status. Configure these in Profile → Settings → Notifications.

Notification email: by default, alerts go to your account email. Enter a different address here if you want notifications sent elsewhere.

Boat health summary: choose how often you receive a health digest email.
- Daily (when issues exist): sent each day you have overdue or due-soon components, or inventory problems.
- Daily (always): sent every day regardless — shows an all-clear email when everything is healthy.
- Weekly (when issues exist): sent once a week on your chosen day, only if issues exist.
- Weekly (always): sent every week on your chosen day, whether or not there are issues.
- Off: no health summary emails.
- Off: no summary emails.
- Daily: an email every day while your boat needs attention.
- Weekly: one email per week while your boat needs attention. When "Weekly" is selected, a day-of-week picker appears (Sunday–Saturday) so you choose which day the email arrives.
Note: summary emails are only sent when there are issues to report — if everything is healthy, no email is sent.

Overdue maintenance alerts: tick this checkbox to receive an email the moment a component becomes overdue. Each component can trigger at most one alert every 7 days (so you won't be spammed if an overdue item isn't fixed immediately).

Unsubscribe from all emails: tick this checkbox and save to stop all NautIQ emails immediately — health summaries, overdue alerts, and re-engagement messages. You will still receive essential account emails like password resets. You can re-subscribe at any time by unticking the same box and saving.

Tap "Save preferences" to apply any changes.

Send test email: tap this button to immediately send yourself a test email based on your current boat health and notification settings. It bypasses the daily/weekly schedule and any cooldown, so you'll always receive an email — useful for confirming that your address and preferences are set up correctly.`,
  },
  {
    id: "inventory",
    title: "How to manage inventory",
    content: `The Inventory tab is your on-board register — record everything on the boat: spare parts, safety equipment (EPIRB, PLB, VHF, life jackets, flares, fire extinguishers), tools, consumables, and anything else you want to track. Each item has a current quantity and an optional minimum quantity — when stock reaches or drops below the minimum, it shows as low stock.

To filter inventory, tap any of the coloured stat tiles at the top of the Inventory page:
- Tap "Low stock", "Critical missing", "Stocked", or "Expiring soon" to show only items in that category.
- The active tile gets a coloured border so you can see which filter is on.
- Tap the same tile again to clear the filter and return to the full list.
- Use the "All components" dropdown below the tiles to narrow further by boat component.
- A "Clear filters" link appears when any filter is active.

To add an item manually:
1. Go to the Inventory tab and tap "+ Add item."
2. Fill in the name, quantity, unit (ea, L, kg, etc.), category, and optionally link it to a maintenance component.
3. Add an expiry date if the item has one (e.g. flares, first aid supplies, fire extinguishers).
4. Add notes for any details like fitting info or service notes.
5. Mark it as a critical item if it's essential for safety or operation.

To scan an item:
1. Open the ☰ menu and tap "Scan item."
2. Choose "Take photo" to use your camera, or "Choose from device" to pick an existing image.
3. The AI identifies what the item is — this works for anything on board, not just marine parts (e.g. sunglasses, sunscreen, tools, food).
4. If a matching item already exists in your inventory, it shows the current stock and lets you add to it, remove from it, or set an exact count.
5. If it's a new item, it asks "How many do you have on board?" — enter the quantity, pick a unit, and tap Add. Use "Add more details" to set the name, category, component link, or notes.

To adjust stock (used or restocked a part):
- On any inventory item's page, tap "+ Add" or "Use" to update the quantity.
- You can also say to the AI: "I used 2 oil filters" or "I bought a new impeller."
- Tap "Restock item" or "Used item" below the chat box for a quick shortcut.

Linking items to components: When an inventory item is linked to a component, low stock increases the component's risk score — so you'll be reminded to restock before you need to service it.

Expiry dates: You can record an expiry date on any inventory item (e.g. flares, first aid supplies, epoxy, fuel treatment). Items expiring within 90 days show an amber "Exp. Xd" badge; expired items show a red "Expired" badge. The Inventory page shows an "Expiring soon" tile so you can see at a glance how many items need attention. Expired and near-expired critical items also increase your boat's health risk score.

To edit an inventory item: Tap the pencil icon next to an item in the list, or tap the item name to open its detail page and edit all fields there.

Photos: You can attach up to 3 photos to any inventory item — useful for showing the part, its location on the boat, or a label with the part number. On the item's edit page, scroll down to the Photos section. Tap "Upload" to select an image from your device, or tap "Camera" to take a new photo. Tap any thumbnail to view it full size. To remove a photo, hover over the thumbnail and tap the X, or open it full size and tap "Remove".`,
  },
  {
    id: "best-practices",
    title: "Setting up inventory and maintenance: best practices",
    content: `How you structure inventory and maintenance components makes a big difference to how useful NautIQ is day-to-day. Here are the recommended patterns.

INVENTORY: one item per physical location, or one item per interchangeable batch

Use a separate inventory item for each physically distinct item that has its own location or its own expiry date:
- "Fire extinguisher — cockpit" (qty: 1, location: Cockpit, expiry: Jan 2027, critical item: yes)
- "Fire extinguisher — saloon" (qty: 1, location: Saloon, expiry: Mar 2026, critical item: yes)
- "Fire extinguisher — engine bay" (qty: 1, location: Engine bay, expiry: Jan 2027, critical item: yes)

This way each extinguisher's expiry is tracked independently and you'll get an alert for the one that's coming due, not a single merged expiry for all of them.

Use a single item with a higher quantity for interchangeable parts stored together:
- "Alternator belt" (qty: 3, location: Spares locker, min qty: 1) — three identical belts stored together, any one is interchangeable.
- "Engine oil filter" (qty: 2, location: Engine bay locker, min qty: 1)
- "Impeller" (qty: 2, min qty: 1)

The rule of thumb: if the items are identical and stored together, use quantity. If they differ by location, expiry date, or spec, give each one its own record.

Tip: use a consistent category (e.g. "Safety") for related items. On the Inventory page you can filter by linked component, and on the Health page grouped items are easier to review at a glance.

MAINTENANCE COMPONENTS: one component per inspection or service task

Create a component for every recurring inspection or service task — not just for physical parts. For example:

Fire extinguisher check:
1. Go to Maintain → Add component.
2. Name it "Fire extinguisher check" and put it in the Safety system.
3. Set a time-based service interval — e.g. every 12 months.
4. Link the fire extinguisher inventory items to this component (Linked inventory items → select each extinguisher).

This means:
- The component will show as due when the annual check is approaching.
- If any extinguisher inventory item is low (e.g. you've disposed of a failed unit and haven't replaced it), the component's risk score is penalised automatically.
- You get a single maintenance history of every inspection, rather than trying to remember when you last checked them.

Other examples of inspection-style components to add:
- "Life jacket inspection" (Safety, annual)
- "EPIRB check" (Safety, annual — link your EPIRB inventory item)
- "Bilge pump test" (Plumbing, 3 months)
- "Flare check" (Safety, annual — link your flare inventory items with their expiry dates)

LOGGING MAINTENANCE for an inspection

When you carry out a fire extinguisher check (or any inspection):
1. Go to Maintain → tap "Fire extinguisher check."
2. Tap "Log Maintenance."
3. Fill in the date, work done (e.g. "Annual visual inspection — all three extinguishers pressure checked and in date"), and any notes.
4. Tap "Save." The component resets to healthy and the next due date is recalculated.

This gives you a permanent record of every inspection with dates, notes, and photos if needed — useful for insurance, surveys, or sale.

You can also email a maintenance note to log@nautiq.cloud and NautIQ will parse it into a draft maintenance record for you to review.`,
  },
  {
    id: "chat",
    title: "How to use the AI assistant",
    content: `The Home screen is your AI assistant. You can type or speak to it — tap the microphone button to use your voice.

Things you can ask or say:
- "What maintenance is due?" → shows overdue and upcoming service items.
- "How's the boat doing?" → shows the overall health score and urgent items.
- "What am I low on?" → shows your inventory status.
- "I did an oil change today" → creates a maintenance record (AI parses the work, you review and save).
- "I serviced the engine" or "changed the impeller" → same as above — any maintenance statement triggers a draft card.
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
- Used item: quickly log that you consumed an inventory item.
- New chat: clear the conversation and start fresh (appears when there are messages).

Shortcut chips (below the assistant prompt): quick-tap buttons for Watch list, Log visit, and Feedback.

To share feedback: tap the purple "Feedback" chip on the Home screen, or open the Profile menu (your avatar, top right of the Home screen) and tap "Share feedback." Rate NautIQ from 1 to 10 and optionally add a comment — it goes straight to the NautIQ team.

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
    content: `The health score (0–100) represents the overall condition of your boat's maintenance. A score of 100 means everything is within service intervals and well-stocked. The score drops as components approach or exceed their service intervals, or when linked inventory items run low.

How the score is calculated:
- Each component gets a risk score based on how far through its service interval it is (time and/or engine hours). Components that are more than 85% through their interval are marked "due soon" and start contributing risk; overdue components contribute more (quadratic scale).
- Inventory penalties are added to a component's risk if linked inventory items are low (out of stock: +25–40, below minimum: +15–25, at minimum: +5–10 — critical items are penalised more).
- The component risk scores are averaged and subtracted from 100.
- An inactivity penalty is then subtracted directly (not averaged): −15 pts if no trips, maintenance, or visits in 30–59 days; −35 pts for 60–89 days; −60 pts for 90+ days. This always has a visible impact.
- Unresolved watch items that have been sitting too long also subtract directly: −5 pts each for items 7–29 days old, −10 pts each for 30–59 days old, −20 pts each for 60+ days old, capped at −40 pts total. Resolving the watch items removes the penalty.
- The Health page shows a "Why X/100?" explanation listing the reasons. You can also ask the AI "explain my health score" for a full breakdown.

The score and breakdown are shown on the Home screen and in the health banner at the top of the chat.

Home screen dashboard tiles: The four tiles next to the gauge on the Home screen highlight the most important issues.
- "Maint. overdue" (red): number of components past their service interval.
- "Due soon" (amber): components approaching their service interval.
- "Critical low" (red) or "Stock low" (amber): shown instead of the healthy count when inventory items drop below their minimum stock level. Critical items are highlighted in red.
- "Engine hrs": total engine hours logged.

The "Needs attention" list below the gauge shows individual overdue or due-soon maintenance items (tap to open the component) and any low-stock inventory items (tap to open the inventory item). If everything is fine, a green "All clear" banner is shown.`,
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
  {
    id: "checkins",
    title: "Logging a boat visit",
    content: `Even when you don't take your boat out, regular check-ins keep your health score accurate and remind you to inspect the boat before problems develop.

How to log a visit:
1. Tap the ☰ menu icon in the top-left corner to open Quick Actions.
2. Tap "Log Visit".
3. Enter the date of your visit (defaults to today) and an optional note about what you checked or noticed.
4. Tap "Save visit".

The Home screen will update to show "Last visit: today" (or the number of days since your last visit) in the navy health panel.

How visits affect your health score:
- 0–29 days since last activity: no penalty
- 30–59 days: mild penalty (score decreases slightly, shown as "due soon")
- 60–89 days: moderate penalty (score decreases more, shown as "overdue")
- 90+ days: significant penalty (large drop in health score)

"Activity" includes any logged trip, saved maintenance record, or check-in — whichever happened most recently.`,
  },
  {
    id: "co-ownership",
    title: "Boat co-ownership",
    content: `Share your boat with crewmates or co-owners so you can all log trips, maintenance, and inventory under the same boat.

To invite a co-owner:
1. Go to Profile → Settings → Your boats.
2. In the boat card, tap "Co-owners" to expand the panel.
3. Tap "Generate invite link."
4. Copy and share the link (valid for 7 days, single-use).

The invited person follows the link, signs in or creates a free NautIQ account, and taps "Accept invitation." The boat then appears in their account with full access.

To remove a co-owner:
1. Open the Co-owners panel in Settings for that boat.
2. Tap "Remove" next to their email.

Notes:
- Only the original boat owner can invite or remove co-owners.
- Co-owners can log trips, maintenance, and inventory changes — they have full write access.
- Deleting a boat is only possible for the original owner.`,
  },
  {
    id: "offline",
    title: "Using NautIQ offline",
    content: `NautIQ is designed to keep working when you lose connectivity. A banner appears at the top of the screen when you're offline.

**What works offline:**
- Browsing previously loaded pages — trips, maintenance records, inventory, components all load from cache
- Adding watch items (maintenance observations)
- Adding inventory items
- Logging maintenance events

Entries added while offline are saved locally on your device and synced automatically the next time you reconnect. The banner shows how many entries are waiting to sync.

**What requires connectivity:**
- The AI assistant and all AI-powered features (inventory scan, trip draft, component suggestions)
- Uploading photos
- Any data you haven't loaded yet on this device

If you navigate to a page you haven't visited before while offline, NautIQ will load the home screen instead — the offline banner tells you what's happening.`,
  },
];

// Compact version injected into the AI chat system prompt.
export const HELP_SYSTEM_PROMPT = `
APP USAGE GUIDE (answer "how do I" questions using this):

OVERVIEW: NautIQ has 5 sections — Home/Chat (AI assistant), Trips (engine hours log), Maintain (component service tracking), Inventory (on-board register of parts, safety equipment, consumables, tools, and gear), Profile (settings/help/report).

GETTING STARTED: After creating your boat, the Home screen shows prompt cards if you haven't logged a trip or added inventory yet. Tap "Log a trip" or "Add items" on those cards to get started, or dismiss them with the X. Once you've completed the action, the card won't appear again.

BOAT SETUP: First-time wizard asks for name, type, propulsion, hull design, hull material, and an optional free-text description — then creates systems and components automatically. Edit boat specs in Profile → Settings → tap "Edit" on any boat — the slide-up form lets you update name, type, propulsion, hull design, hull material, dimensions (length/beam/draft), photo, fuel consumption rate (L/hr), tank capacity (litres), engine meter reading (starting hours total), and description. ENGINE METER READING: Set this in Settings → Your boats → Edit → "Engine meter reading" field. Enter your current engine meter (odometer) total — NautIQ adds all logged trip hours on top of this to calculate the running cumulative total used when logging trips in "Engine meter" mode. Crew (co-owners) and systems are also managed from the same edit form, further down the page. Add more boats via the "Add boat" button in the Your boats section header. Switch boats via the top-right selector. To delete a boat, tap the red trash icon next to it in Settings → Your boats, then type the boat name to confirm — removes all data and cannot be undone. Boat specs and description refine component suggestions and AI advice.

SYSTEMS: Manage systems (groups of components) inside the boat edit form. Go to Profile → Settings → Your boats → tap "Edit" on the boat → scroll to the Systems section at the bottom. Add a system by typing its name and tapping "Add." Delete a system using the trash icon next to it.

LOGGING A TRIP: (1) Start/Stop timer on Home screen — tap "Start Trip" when leaving (GPS location captured), "Stop Trip" when back (GPS location captured again); (2) "+ Log Trip" button on Home; (3) tell the AI "went sailing for 3 hours." If you enter engine hours but leave Fuel blank, NautIQ will estimate fuel used automatically if a fuel consumption rate (litres/hour) is set on your boat in Settings. The estimated fuel is saved with the trip and deducted from your fuel inventory. ENGINE HOURS INPUT: The Engine hours field has two modes — toggle between them with the "Hours on trip / Engine meter" buttons. "Hours on trip" (default): enter only the hours you ran the engine on this trip (e.g. 2.5h). "Engine meter": enter your current engine meter reading (odometer total); NautIQ looks up your previous cumulative total and calculates the trip hours as new reading minus previous total. Use Engine meter mode if you note down your meter reading at the end of each outing. ENGINE METER STARTING POINT WARNING: If no engine meter starting point has been set for the boat, a warning appears in the trip form when you enter engine hours. Tap "Set it in Settings" to go to Settings → Your boats → Edit → "Engine meter reading" and enter your current meter total. This ensures NautIQ's cumulative total and fuel estimates are accurate from the start. The starting point can also be set during the initial onboarding wizard (Step 4: Fuel & engine hours).

FUEL CONSUMPTION RATE: Set in Profile → Settings → Your boats → edit your boat → "Consumption rate (L/hr)". Once set, any trip saved without manual fuel entry will calculate fuel as hours × rate and deduct that amount from inventory automatically. The transaction note will show it was auto-estimated.

FUEL GAUGE: Set your tank capacity in Profile → Settings → Your boats → edit your boat → "Tank capacity (litres)". A fuel gauge will then appear on the Boat Health page next to your health score, showing your current fuel level as a percentage. The current level is tracked from whichever inventory item you've tagged as your primary fuel source.

PRIMARY FUEL SOURCE: Go to Inventory → open an inventory item (e.g. your diesel tank entry) → enable "Primary fuel source". Only one item per boat can be the fuel source. Once set, NautIQ tracks that item's quantity for the fuel gauge and deducts from it automatically when you log trips. If no item is tagged, a reminder card will appear on the Home screen.

EMAIL TO LOG: Email maintenance notes to log@nautiq.cloud from your registered email address. NautIQ parses the email with AI and shows a pre-filled maintenance record card on the Home screen next time you open the app. Tap "Complete maintenance record" to review and save, or X to dismiss.

LOGGING MAINTENANCE VIA CHAT: Just tell the AI what you did — "I did an oil change", "changed the impeller", "serviced the engine", "replaced the bilge pump". The AI creates a pre-filled maintenance draft card that you review and save. You can edit the component, date, work description, notes, and engine hours before saving.

DO NOT RESET SERVICE INTERVAL: When logging or editing a maintenance record, tick "Do not reset service interval" to save the entry without updating the component's last-service date. Useful for minor checks, inspections, or notes where the full service hasn't been done. The record is saved in history but the next-due date and health score remain unchanged.

MAINTENANCE: Each component has a time/engine-hour service interval. NautIQ uses a predictive timeline to estimate due dates based on average usage. Risk score shows overdue/due soon/healthy. Log maintenance via "Log Maintenance" button on the component page or from the Home screen. Fill in date, work done, engine hours, optional spare consumed. Optionally attach up to 3 photos per record — tap "Camera" to take a photo or "Choose" to pick from your library; thumbnails appear in the history table. To delete a maintenance record, tap the trash icon on the history row and confirm with Yes. The Maintenance Overview shows components sorted by urgency; use "All Components" for the full list. On the Home screen, a yellow card suggests components typical for your boat type that you haven't added yet — tap "Add" on any suggestion to add it.

COMPONENTS & SYSTEMS: Components = individual parts needing service (engine, impeller, life jackets…). Systems = groups (Engine, Safety, Electrical…). Add/edit from Maintain tab. Delete from Danger Zone on component page. When adding a component the System field is a combobox — pick an existing system or type a new name and tap "Add as new system" to create it. NautIQ warns you if a similar name already exists (e.g. plural match) so you don't create a duplicate.

INVENTORY: The inventory is the on-board register — record everything on the boat: spare parts, safety equipment (EPIRB, PLB, VHF, life jackets, flares, fire extinguishers), tools, consumables, and any other gear. Add items via "+ Add item" or camera "Scan item" on Home. Adjust stock by saying "I used X" or "I bought X" to the AI, or via the Restock item / Used item chips, or from the item's page. Link items to components so low stock raises the risk score. Set an expiry date on items like flares, fire extinguishers, first aid supplies, or fuel treatment — items expiring within 90 days show an amber badge; expired items show red. The "Expiring soon" tile on the Inventory page shows the count at a glance. Expired critical items increase the boat health risk score. Photos: Each inventory item can have up to 3 photos. Open the item's edit page (tap the pencil icon) and scroll to Photos — tap "Upload" to choose an image from your device or "Camera" to take a photo. Tap a thumbnail to view full size. Remove a photo with the X on the thumbnail or the Remove button in full-size view.

INVENTORY & MAINTENANCE BEST PRACTICES: Use a SEPARATE inventory item for each physically distinct item that has its own location or expiry date (e.g. three fire extinguishers in different locations = three records, each with its own expiry). Use a SINGLE item with higher quantity for identical interchangeable parts stored together (e.g. 3 alternator belts in the spares locker = one record, qty 3, min qty 1). Use a consistent category (e.g. "Safety") to group related items. Create a MAINTENANCE COMPONENT for every recurring inspection task, not just physical parts — e.g. "Fire extinguisher check" in the Safety system with a 12-month interval. Link the extinguisher inventory items to that component so low stock raises the risk score automatically. Log a maintenance record every time you carry out the check — fill in date, work done, and notes for a permanent inspection history. Other inspection components to set up: life jacket inspection (annual), EPIRB check (annual), bilge pump test (3 months), flare check (annual — link flare inventory with expiry dates).

BOAT REPORT / PDF: Say "download a boat report" or "send me a PDF summary" to generate and download a full PDF of health, maintenance schedule, inventory, and recent trips. Also available from Profile tab → "Download Boat Report."

NOTIFICATIONS: Configure in Profile → Settings → Notifications. Options: (1) Notification email — defaults to your login email; enter another address to redirect alerts. (2) Boat health summary — Off / Daily / Weekly; emails only sent while issues exist. Weekly mode shows a day-of-week picker. (3) Overdue maintenance alerts — checkbox; sends an email when a component goes overdue, at most once per component per 7 days. (4) Unsubscribe from all emails — tick this to stop all NautIQ emails immediately; untick to re-subscribe at any time. Tap "Save preferences" to save. Use "Check now" to trigger an immediate check (sends emails if issues found).

HEALTH SCORE: 0–100. Drops as components go overdue, inventory items run low, or items expire. Shown on the Home screen and in the header. Tap the score to open the Boat Health page — it explains exactly why the score is what it is, lists overdue maintenance, due-soon items, and inventory issues, and gives a specific recommendation for each item to restore the score to 100. The Home screen shows four tiles: "Maint. overdue" (red), "Due soon" (amber), an inventory tile ("Critical low" in red or "Spares low" in amber when stock is low, else "Healthy" in green), and "Engine hrs". A "Needs attention" list below the gauge shows individual overdue/due-soon maintenance items and low-stock inventory items; tap any row to go to that component or inventory item.

VOICE: Every notes field has a mic button. The main mic button on Home sends voice messages to the AI.

CHAT RESET: Open the ☰ menu (top left) and tap "New chat" to clear the current conversation and start fresh.

SCOPE: Only answer questions about this boat, maintenance, trips, inventory, and the NautIQ app. For anything else reply: "Sorry, I can only help with questions about your boat and the NautIQ app."

NAVIGATION: Scroll-to-top button appears at the bottom centre of the screen on any long page after scrolling down. What's New card appears in chat when new features are released.

SIGN IN: On the login page there is a "Stay signed in on this device" toggle (on by default). When enabled, your session persists across browser closes so you don't need to log in each time. Turn it off on shared or public devices.

RESET PASSWORD: Forgotten your password? On the sign-in screen tap "Forgot password?" and enter your email — a 6-digit code is sent to your inbox. Enter the code and your new password on the next screen and tap "Update password." You can also reset from inside the app: Profile → Settings → Account → Reset password — same 6-digit code flow.

COST TRACKING: Add a cost when logging maintenance (the "Cost" field in the log form or chat draft card) or when restocking inventory (the "Cost paid" field in the restock card). All costs are visible in Profile → Cost tracker, which shows total spend by year, broken down into maintenance vs parts. Useful for understanding total cost of ownership and for resale documentation.

WELCOME GREETING / PBA: Each time you open the Home screen, your personal boat assistant (PBA) greets you with a personalised summary — recent activity, health status, trip encouragement, and maintenance reminders. The card can be dismissed. You can also ask "give me an update", "how's my boat doing", or "what's new" at any time in chat to get the same personalised briefing.

WATCH LIST: The Watch List on the Maintenance page is for tracking things that need attention but aren't a full maintenance job yet — e.g. wear and tear, something to keep an eye on, or a reminder to sort something later. To add a watch item: open the Maintenance page and tap "Add" in the Watch List section, or tap Watch item in the Quick Actions menu (☰, top left), or tap the "Watch list" shortcut on the Home screen. Fill in a title (required), optionally pick a component, add notes, and attach up to 3 photos. When you're ready to resolve a watch item, tap "Mark done" on the card — a log maintenance form opens pre-filled with the watch item's title and component, so you can add details and save it as a proper maintenance log entry. The watch item is then marked resolved and disappears from the list. To remove a watch item without logging maintenance, tap "Delete."

BOAT VISITS / CHECK-INS: Even if you don't take a trip, you should log a visit when you go to check on your boat. Tap the green "Log visit" shortcut button on the Home screen (below the assistant prompt), or open the Quick Actions menu (☰ icon, top left) and tap "Log Visit." Enter the date and an optional note. Regular visits prevent the health score from dropping due to inactivity — the score decreases if your boat hasn't been visited, used, or serviced in 30+ days. The Home screen shows "Last visit: Xd ago" in the health panel so you can see at a glance when you were last aboard.

FEEDBACK: Users can share feedback with the NautIQ team directly from the app. Two ways: (1) tap the purple "Feedback" chip on the Home screen (below the assistant prompt), or (2) tap the profile avatar (top right of the Home screen) → "Share feedback." The feedback form has a 1–10 NPS score and an optional comments box. Submitted feedback is emailed to the NautIQ team.

HOME ICON: Tapping the Home tab in the bottom navigation when you're already on the Home screen resets the chat and returns you to the health overview — useful for starting a fresh conversation without navigating away.

BOAT CO-OWNERSHIP / SYNDICATE: Share a boat with crewmates or co-owners. In Profile → Settings → Your boats, open the "Co-owners" section for a boat and tap "Generate invite link." Send the link to the person you want to add — they follow the link, create an account or sign in, and the boat is added to their NautIQ. Both owners see the same boat, trips, maintenance records, and inventory. The boat owner can remove a co-owner from the same Co-owners panel. To accept an invite, the recipient must be signed in; if not, the link prompts them to sign in or create an account first.

HEALTH SCORE BREAKDOWN: The boat health score is 100 minus penalties applied in sequence:
1. Component risk average: Each component with a known service interval is assessed. "OK" components (less than 85% through their interval) contribute 0 risk. Components 85–100% through their interval contribute linearly up to 100 risk points. Overdue components contribute 100+ (quadratic — the longer overdue, the worse). Inventory penalties (low/out-of-stock/expired inventory items) are added to the linked component's risk score. The average of all component risk scores is subtracted from 100.
2. Inactivity penalty (direct deduction — not diluted): If the boat hasn't had a trip, maintenance event, or check-in in 30+ days, a penalty is subtracted directly: 30–59 days = −15 pts, 60–89 days = −35 pts, 90+ days = −60 pts.
3. Watch item penalty (direct deduction): Unresolved maintenance watch items left too long reduce the score — 7–29 days old = −5 pts each, 30–59 days old = −10 pts each, 60+ days old = −20 pts each. Capped at −40 pts total. Resolving the watch items removes the penalty.
To explain "why is my score X?": list overdue components, due-soon components, inventory issues, inactivity penalty, and unresolved watch items. The Health page also shows a "Why X/100?" explanation automatically.

OFFLINE MODE: NautIQ keeps working offline. Previously visited pages (trips, maintenance, inventory, components) load from the device cache. Watch items, inventory items, and maintenance events can be added while offline — stored locally and synced automatically on reconnect; a banner shows the pending count. Navigating to an uncached page falls back to the home screen with the offline banner. The AI assistant and all AI-powered features (inventory scan, trip draft, component suggestions, photo uploads) are unavailable offline.
`.trim();
