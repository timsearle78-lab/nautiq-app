export type SuggestedComponent = {
  name: string;
  system: string;
  reason: string;
};

export type BoatDetails = {
  type?: string | null;
  propulsion?: string | null;
  hull_design?: string | null;
  hull_material?: string | null;
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

// Extra suggestions based on propulsion type
const PROPULSION_EXTRAS: Record<string, SuggestedComponent[]> = {
  "Outboard": [
    { name: "Outboard Engine", system: "Engine", reason: "Track engine hours and service intervals" },
    { name: "Gear Oil (Lower Unit)", system: "Engine", reason: "Change annually or every 100h" },
    { name: "Propeller", system: "Engine", reason: "Inspect for nicks after use" },
  ],
  "Electric": [
    { name: "Electric Motor", system: "Engine", reason: "Check connections and cooling annually" },
    { name: "Drive Battery Pack", system: "Electrical", reason: "Test capacity seasonally; monitor cell health" },
    { name: "Battery Management System (BMS)", system: "Electrical", reason: "Verify operation each season" },
    { name: "Charger / Shore Power", system: "Electrical", reason: "Inspect cable and connector annually" },
  ],
  "Hybrid": [
    { name: "Electric Motor", system: "Engine", reason: "Check connections and cooling annually" },
    { name: "Drive Battery Pack", system: "Electrical", reason: "Test capacity seasonally; monitor cell health" },
    { name: "Battery Management System (BMS)", system: "Electrical", reason: "Verify operation each season" },
  ],
};

// Extra suggestions based on hull material
const HULL_MATERIAL_EXTRAS: Record<string, SuggestedComponent[]> = {
  "Wood": [
    { name: "Hull Caulking / Sealant", system: "Hull", reason: "Inspect and re-caulk seams annually" },
    { name: "Deck Caulking", system: "Hull", reason: "Inspect teak or deck seams seasonally" },
    { name: "Varnish / Topcoat", system: "Hull", reason: "Apply UV-protective varnish each season" },
  ],
  "Steel": [
    { name: "Hull Rust Inspection", system: "Hull", reason: "Check for rust spots and re-prime annually" },
    { name: "Sacrificial Anodes (Hull)", system: "Hull", reason: "Steel hulls consume anodes quickly — check every 6 months" },
  ],
  "Aluminium": [
    { name: "Aluminium Corrosion Inspection", system: "Hull", reason: "Inspect for galvanic corrosion; ensure anodes are compatible" },
  ],
  "Ferro-cement": [
    { name: "Hull Crack Survey", system: "Hull", reason: "Inspect ferro-cement for hairline cracks annually" },
  ],
  "Inflatable (Hypalon)": [
    { name: "Hypalon Seam Inspection", system: "Hull", reason: "Check for delamination and UV cracking annually" },
    { name: "Tube Pressure Check", system: "Hull", reason: "Check inflation pressure seasonally" },
  ],
  "Inflatable (PVC)": [
    { name: "PVC Tube Inspection", system: "Hull", reason: "Inspect for UV cracking and seam integrity annually" },
    { name: "Tube Pressure Check", system: "Hull", reason: "Check inflation pressure seasonally" },
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
  boatTypeOrDetails: string | null | BoatDetails,
  existingComponentNames: string[]
): SuggestedComponent[] {
  // Support legacy string call signature
  const details: BoatDetails = typeof boatTypeOrDetails === "string" || boatTypeOrDetails === null
    ? { type: boatTypeOrDetails }
    : boatTypeOrDetails;

  const boatType = details.type ?? "";
  const baseList = SUGGESTIONS[boatType] ?? SUGGESTIONS["Other"];

  // Build extras list from propulsion and hull material
  const extras: SuggestedComponent[] = [];

  if (details.propulsion) {
    const propExtras = PROPULSION_EXTRAS[details.propulsion] ?? [];
    extras.push(...propExtras);
  }

  if (details.hull_material) {
    const hullExtras = HULL_MATERIAL_EXTRAS[details.hull_material] ?? [];
    extras.push(...hullExtras);
  }

  // Deduplicate extras against base list by name
  const baseNames = new Set(baseList.map((s) => s.name));
  const uniqueExtras = extras.filter((e) => !baseNames.has(e.name));

  const combined = [...baseList, ...uniqueExtras];
  return combined.filter((s) => !isCovered(s.name, existingComponentNames));
}
