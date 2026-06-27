export type SuggestedComponent = {
  name: string;
  system: string;
  reason: string;
};

// Typical components per boat type. system mirrors common NautIQ system names.
const SUGGESTIONS: Record<string, SuggestedComponent[]> = {
  Sailboat: [
    { name: "Main Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Raw Water Impeller", system: "Engine", reason: "Critical — should be replaced annually or every 200h" },
    { name: "Engine Oil & Filter", system: "Engine", reason: "Regular service item" },
    { name: "Fuel Filter", system: "Engine", reason: "Annual replacement recommended" },
    { name: "Alternator Belt", system: "Engine", reason: "Inspect and replace on a schedule" },
    { name: "Standing Rigging", system: "Rigging", reason: "Inspect annually; replace every 10 years" },
    { name: "Running Rigging", system: "Rigging", reason: "Check halyards, sheets, and blocks regularly" },
    { name: "Mainsail", system: "Sails", reason: "Track UV damage, stitching, and batten condition" },
    { name: "Headsail / Genoa", system: "Sails", reason: "Annual inspection for wear and UV damage" },
    { name: "Life Jackets / PFDs", system: "Safety", reason: "Annual inspection and re-arm gas cylinders" },
    { name: "Fire Extinguishers", system: "Safety", reason: "Annual inspection and pressure check" },
    { name: "Flares / Pyrotechnics", system: "Safety", reason: "Replace before expiry date" },
    { name: "EPIRB", system: "Safety", reason: "Annual registration check; battery expiry tracking" },
    { name: "Bilge Pump", system: "Plumbing", reason: "Test and service regularly" },
    { name: "Seacocks", system: "Plumbing", reason: "Exercise and grease annually" },
    { name: "Zincs / Anodes", system: "Hull", reason: "Replace when 50% depleted, typically annually" },
    { name: "Bottom Paint / Antifoul", system: "Hull", reason: "Apply each haulout season" },
    { name: "Batteries", system: "Electrical", reason: "Test capacity annually; replace every 3–5 years" },
    { name: "VHF Radio", system: "Electrical", reason: "Annual inspection; license renewal tracking" },
    { name: "AIS", system: "Electrical", reason: "Verify operation each season" },
    { name: "Windlass", system: "Deck", reason: "Service annually; check chain and shackle pins" },
    { name: "Anchor & Chain", system: "Deck", reason: "Inspect for wear; re-galvanise chain as needed" },
  ],
  Motorboat: [
    { name: "Main Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Raw Water Impeller", system: "Engine", reason: "Critical — replace every 100–200h or annually" },
    { name: "Engine Oil & Filter", system: "Engine", reason: "Service every 100h or annually" },
    { name: "Fuel Filter / Water Separator", system: "Engine", reason: "Replace annually or when clogged" },
    { name: "Spark Plugs", system: "Engine", reason: "Petrol engines — replace per manufacturer schedule" },
    { name: "Alternator Belt", system: "Engine", reason: "Inspect and replace on a schedule" },
    { name: "Coolant / Thermostat", system: "Engine", reason: "Check level seasonally; replace thermostat every few years" },
    { name: "Gear Oil (Drive / Outdrive)", system: "Engine", reason: "Change annually or every 100h" },
    { name: "Propeller", system: "Engine", reason: "Inspect for nicks and balance after any grounding" },
    { name: "Life Jackets / PFDs", system: "Safety", reason: "Annual inspection and re-arm gas cylinders" },
    { name: "Fire Extinguishers", system: "Safety", reason: "Annual inspection and pressure check" },
    { name: "Flares / Pyrotechnics", system: "Safety", reason: "Replace before expiry date" },
    { name: "EPIRB", system: "Safety", reason: "Annual registration check; battery expiry tracking" },
    { name: "Bilge Pump", system: "Plumbing", reason: "Test and service regularly" },
    { name: "Seacocks / Thru-Hulls", system: "Plumbing", reason: "Exercise and grease annually" },
    { name: "Zincs / Anodes", system: "Hull", reason: "Replace when 50% depleted, typically annually" },
    { name: "Bottom Paint / Antifoul", system: "Hull", reason: "Apply each haulout season" },
    { name: "Batteries", system: "Electrical", reason: "Test capacity annually; replace every 3–5 years" },
    { name: "VHF Radio", system: "Electrical", reason: "Annual inspection; license renewal tracking" },
    { name: "Anchor & Chain", system: "Deck", reason: "Inspect for wear and shackle pins" },
  ],
  Catamaran: [
    { name: "Port Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Starboard Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Raw Water Impeller (Port)", system: "Engine", reason: "Replace every 200h or annually" },
    { name: "Raw Water Impeller (Starboard)", system: "Engine", reason: "Replace every 200h or annually" },
    { name: "Engine Oil & Filter (Port)", system: "Engine", reason: "Service every 100h or annually" },
    { name: "Engine Oil & Filter (Starboard)", system: "Engine", reason: "Service every 100h or annually" },
    { name: "Standing Rigging", system: "Rigging", reason: "Inspect annually; replace every 10 years" },
    { name: "Running Rigging", system: "Rigging", reason: "Check halyards, sheets, and blocks regularly" },
    { name: "Mainsail", system: "Sails", reason: "Annual inspection for UV and stitching wear" },
    { name: "Headsail / Furling Jib", system: "Sails", reason: "Annual inspection for wear and UV damage" },
    { name: "Life Jackets / PFDs", system: "Safety", reason: "Annual inspection and re-arm gas cylinders" },
    { name: "Fire Extinguishers", system: "Safety", reason: "Annual inspection; one per hull recommended" },
    { name: "Flares / Pyrotechnics", system: "Safety", reason: "Replace before expiry date" },
    { name: "EPIRB", system: "Safety", reason: "Annual registration check; battery expiry tracking" },
    { name: "Bilge Pumps (Port & Starboard)", system: "Plumbing", reason: "Both hulls need individual bilge pump checks" },
    { name: "Seacocks", system: "Plumbing", reason: "Exercise and grease annually" },
    { name: "Zincs / Anodes", system: "Hull", reason: "Both hulls — replace when 50% depleted" },
    { name: "Bottom Paint / Antifoul", system: "Hull", reason: "Apply each haulout season" },
    { name: "Batteries", system: "Electrical", reason: "Test capacity annually; replace every 3–5 years" },
    { name: "VHF Radio", system: "Electrical", reason: "Annual inspection; license renewal tracking" },
    { name: "AIS", system: "Electrical", reason: "Verify operation each season" },
  ],
  RIB: [
    { name: "Outboard Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Spark Plugs", system: "Engine", reason: "Replace per manufacturer schedule" },
    { name: "Fuel Filter", system: "Engine", reason: "Replace annually" },
    { name: "Gear Oil (Lower Unit)", system: "Engine", reason: "Change annually or every 100h" },
    { name: "Propeller", system: "Engine", reason: "Inspect for nicks after use" },
    { name: "Inflation / Tubes", system: "Hull", reason: "Check pressure and tube condition seasonally" },
    { name: "Hypalon / PVC Seams", system: "Hull", reason: "Inspect for delamination or UV cracking annually" },
    { name: "Zincs / Anodes", system: "Hull", reason: "Replace when 50% depleted" },
    { name: "Life Jackets / PFDs", system: "Safety", reason: "Annual inspection and re-arm gas cylinders" },
    { name: "Fire Extinguisher", system: "Safety", reason: "Annual inspection and pressure check" },
    { name: "Flares / Pyrotechnics", system: "Safety", reason: "Replace before expiry date" },
    { name: "Batteries", system: "Electrical", reason: "Test capacity annually" },
    { name: "VHF Radio", system: "Electrical", reason: "Annual inspection" },
    { name: "Anchor & Chain", system: "Deck", reason: "Inspect for wear and shackle pins" },
  ],
  Other: [
    { name: "Main Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Raw Water Impeller", system: "Engine", reason: "Critical — replace annually or every 200h" },
    { name: "Engine Oil & Filter", system: "Engine", reason: "Service every 100h or annually" },
    { name: "Life Jackets / PFDs", system: "Safety", reason: "Annual inspection and re-arm gas cylinders" },
    { name: "Fire Extinguishers", system: "Safety", reason: "Annual inspection and pressure check" },
    { name: "Flares / Pyrotechnics", system: "Safety", reason: "Replace before expiry date" },
    { name: "Bilge Pump", system: "Plumbing", reason: "Test and service regularly" },
    { name: "Zincs / Anodes", system: "Hull", reason: "Replace when 50% depleted, typically annually" },
    { name: "Batteries", system: "Electrical", reason: "Test capacity annually; replace every 3–5 years" },
    { name: "VHF Radio", system: "Electrical", reason: "Annual inspection; license renewal tracking" },
  ],
};

function tokenize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}

function isCovered(suggestion: string, existing: string[]): boolean {
  const sToks = new Set(tokenize(suggestion));
  for (const name of existing) {
    const eToks = new Set(tokenize(name));
    let hits = 0;
    for (const t of sToks) if (eToks.has(t)) hits++;
    // covered if >50% of suggestion tokens match an existing component name
    if (hits / sToks.size >= 0.5) return true;
  }
  return false;
}

export function getMissingComponents(
  boatType: string | null,
  existingComponentNames: string[]
): SuggestedComponent[] {
  const list = SUGGESTIONS[boatType ?? ""] ?? SUGGESTIONS["Other"];
  return list.filter((s) => !isCovered(s.name, existingComponentNames));
}
