"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor,
  MessageSquare,
  Wrench,
  Package,
  LayoutDashboard,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SystemRow = { id: string; name: string };
type ComponentRow = {
  id: string;
  name: string;
  system_id: string | null;
  service_interval_months: number | null;
  service_interval_engine_hours: number | null;
};

type SparePreset = {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  is_critical: boolean;
};

// ─── Spare Presets ────────────────────────────────────────────────────────────

const UNIVERSAL_SPARES: SparePreset[] = [
  { name: "First aid kit",      category: "Safety",     unit: "ea",   quantity: 1, is_critical: true  },
  { name: "Flares",             category: "Safety",     unit: "ea",   quantity: 6, is_critical: true  },
  { name: "Fire extinguisher",  category: "Safety",     unit: "ea",   quantity: 2, is_critical: true  },
  { name: "Fuses assortment",   category: "Electrical", unit: "set",  quantity: 1, is_critical: false },
  { name: "Cable ties",         category: "General",    unit: "box",  quantity: 1, is_critical: false },
  { name: "Duct tape",          category: "General",    unit: "roll", quantity: 2, is_critical: false },
  { name: "WD-40",              category: "General",    unit: "can",  quantity: 1, is_critical: false },
  { name: "Zinc anodes",        category: "Engine",     unit: "ea",   quantity: 4, is_critical: true  },
];

const MOTOR_SPARES: SparePreset[] = [
  { name: "Engine oil",         category: "Engine", unit: "L",  quantity: 5, is_critical: true  },
  { name: "Oil filter",         category: "Engine", unit: "ea", quantity: 2, is_critical: true  },
  { name: "Fuel filter",        category: "Engine", unit: "ea", quantity: 2, is_critical: true  },
  { name: "Raw water impeller", category: "Engine", unit: "ea", quantity: 2, is_critical: true  },
  { name: "Alternator belt",    category: "Engine", unit: "ea", quantity: 2, is_critical: false },
  { name: "Coolant",            category: "Engine", unit: "L",  quantity: 2, is_critical: false },
  { name: "Spark plugs",        category: "Engine", unit: "ea", quantity: 8, is_critical: false },
];

const SAIL_SPARES: SparePreset[] = [
  { name: "Shackles assorted",      category: "Rigging", unit: "ea",   quantity: 6,  is_critical: false },
  { name: "Running rigging line",   category: "Rigging", unit: "m",    quantity: 10, is_critical: false },
  { name: "Sail repair tape",       category: "Sails",   unit: "roll", quantity: 2,  is_critical: false },
  { name: "Standing rigging wire",  category: "Rigging", unit: "m",    quantity: 5,  is_critical: false },
  { name: "Raw water impeller",     category: "Engine",  unit: "ea",   quantity: 1,  is_critical: true  },
];

function getSparePresets(boatType: string): SparePreset[] {
  const isSail = boatType === "Sailboat" || boatType === "Catamaran";
  return [...UNIVERSAL_SPARES, ...(isSail ? SAIL_SPARES : MOTOR_SPARES)];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const BOAT_TYPES = ["Motorboat", "Sailboat", "Catamaran", "Yacht", "RIB", "Other"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-ocean-200/70 mb-1.5">
        <span>Step {step} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-ocean-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  loading = false,
  onSkip,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  onSkip?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/15"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:opacity-60 shadow-lg shadow-ocean-900/40"
      >
        {loading ? "Working…" : nextLabel}
        {!loading && <ChevronRight size={16} />}
      </button>
      {onSkip && (
        <button
          onClick={onSkip}
          className="text-sm text-ocean-200/60 hover:text-ocean-200 transition px-2 py-2.5"
        >
          Skip
        </button>
      )}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Boat form
  const [boatName, setBoatName] = useState("");
  const [boatType, setBoatType] = useState("Motorboat");

  // After creation
  const [boatId, setBoatId] = useState<string | null>(null);
  const [boatDisplayName, setBoatDisplayName] = useState("");
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [components, setComponents] = useState<ComponentRow[]>([]);

  // Inventory step
  const sparePresets = useMemo(() => getSparePresets(boatType), [boatType]);
  const [selectedSpares, setSelectedSpares] = useState<Set<string>>(
    () => new Set(sparePresets.filter((s) => s.is_critical).map((s) => s.name))
  );

  // ── Handlers ────────────────────────────────────────────────────

  async function handleCreateBoat() {
    if (!boatName.trim()) { setError("Please enter a boat name."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/create-boat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boatName.trim(), type: boatType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setBoatId(data.boatId);
      setBoatDisplayName(data.boatName);
      setSystems(data.systems);
      setComponents(data.components);
      // Reset spare selection based on actual boat type
      setSelectedSpares(new Set(getSparePresets(boatType).filter((s) => s.is_critical).map((s) => s.name)));
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedInventory() {
    if (!boatId) { setStep(4); return; }
    const items = sparePresets.filter((p) => selectedSpares.has(p.name));
    if (items.length === 0) { setStep(4); return; }
    setLoading(true);
    try {
      await fetch("/api/onboarding/seed-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boatId, items }),
      });
    } finally {
      setLoading(false);
      setStep(4);
    }
  }

  function toggleSpare(name: string) {
    setSelectedSpares((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-ocean-900 to-ocean-700 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* ── Step 0: Welcome ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-ocean-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-ocean-900/50">
              <Anchor size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome to NautIQ</h1>
            <p className="mt-2 text-sm text-ocean-200 max-w-sm mx-auto">
              Your smart boat companion for maintenance tracking, trip logging, and keeping your vessel in top shape.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-5 text-left space-y-4">
              {[
                { icon: Wrench,         label: "Maintenance tracking", desc: "Never miss a service with smart reminders based on time and engine hours" },
                { icon: LayoutDashboard, label: "Health dashboard",   desc: "See your boat's overall health score and what needs attention" },
                { icon: Package,        label: "Inventory management", desc: "Track spare parts so you're never caught short at sea" },
                { icon: MessageSquare,  label: "AI assistant",        desc: "Log trips, find parts, and get answers by just describing them" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-ocean-500/20 flex items-center justify-center border border-ocean-500/20">
                    <Icon size={16} className="text-ocean-200" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-ocean-200/70 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-ocean-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-600 shadow-lg shadow-ocean-900/40"
            >
              <Sparkles size={16} />
              Get started
            </button>
            <p className="mt-3 text-xs text-ocean-200/60">Takes about 2 minutes to set up</p>
          </div>
        )}

        {/* ── Step 1: Boat Setup ──────────────────────────────────── */}
        {step === 1 && (
          <div>
            <ProgressBar step={1} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-white">Tell us about your boat</h2>
            <p className="mt-1 text-sm text-ocean-200/70">We'll use this to set up your maintenance systems.</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">Boat name</label>
                <input
                  type="text"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBoat()}
                  className={inputCls}
                  placeholder="e.g. Sea Breeze"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">Boat type</label>
                <select
                  value={boatType}
                  onChange={(e) => setBoatType(e.target.value)}
                  className={inputCls}
                >
                  {BOAT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-300">{error}</div>
              )}
            </div>

            <NavButtons
              onBack={() => setStep(0)}
              onNext={handleCreateBoat}
              nextLabel="Create my boat"
              loading={loading}
              nextDisabled={!boatName.trim()}
            />
          </div>
        )}

        {/* ── Step 2: What We Set Up ──────────────────────────────── */}
        {step === 2 && (
          <div>
            <ProgressBar step={2} total={TOTAL_STEPS} />
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={20} className="text-green-400" />
              <h2 className="text-xl font-bold text-white">{boatDisplayName} is ready!</h2>
            </div>
            <p className="text-sm text-ocean-200/70 mt-1 mb-5">
              Here's what we've set up for your {boatType.toLowerCase()} to get you started.
            </p>

            {/* Systems */}
            <div className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-white/8">
                <span className="text-xs font-semibold text-ocean-200/70 uppercase tracking-wide">Systems created</span>
                <span className="ml-2 text-xs text-ocean-200/50">{systems.length} systems</span>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {systems.length > 0 ? systems.map((s) => (
                  <span key={s.id} className="rounded-full border border-ocean-500/30 bg-ocean-500/15 px-3 py-1 text-xs font-medium text-ocean-200">
                    {s.name}
                  </span>
                )) : (
                  <span className="text-xs text-ocean-200/50">No systems seeded</span>
                )}
              </div>
            </div>

            {/* Components grouped by system */}
            <div className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8">
                <span className="text-xs font-semibold text-ocean-200/70 uppercase tracking-wide">Components tracked</span>
                <span className="ml-2 text-xs text-ocean-200/50">{components.length} components</span>
              </div>
              {components.length > 0 ? (
                <ul className="divide-y divide-white/5">
                  {components.slice(0, 8).map((c) => {
                    const system = systems.find((s) => s.id === c.system_id);
                    const hasInterval = c.service_interval_months || c.service_interval_engine_hours;
                    return (
                      <li key={c.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <div className="text-sm font-medium text-white/90">{c.name}</div>
                          {system && <div className="text-xs text-ocean-200/50">{system.name}</div>}
                        </div>
                        {hasInterval && (
                          <span className="text-xs text-ocean-200/50">
                            {c.service_interval_months ? `${c.service_interval_months}mo` : ""}
                            {c.service_interval_months && c.service_interval_engine_hours ? " · " : ""}
                            {c.service_interval_engine_hours ? `${c.service_interval_engine_hours}h` : ""}
                          </span>
                        )}
                      </li>
                    );
                  })}
                  {components.length > 8 && (
                    <li className="px-4 py-2.5 text-xs text-ocean-200/50">+{components.length - 8} more components</li>
                  )}
                </ul>
              ) : (
                <div className="px-4 py-4 text-xs text-ocean-200/50">No components seeded</div>
              )}
            </div>

            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Set up spares" />
          </div>
        )}

        {/* ── Step 3: Essential Spares ────────────────────────────── */}
        {step === 3 && (
          <div>
            <ProgressBar step={3} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-white">Stock your spares</h2>
            <p className="text-sm text-ocean-200/70 mt-1 mb-5">
              Select the essential spare parts to add to your inventory. Critical items are pre-selected.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm overflow-hidden mb-1">
              <div className="px-4 py-2 border-b border-white/8 flex items-center justify-between">
                <span className="text-xs font-semibold text-ocean-200/70 uppercase tracking-wide">Recommended spares</span>
                <button
                  onClick={() => {
                    if (selectedSpares.size === sparePresets.length) {
                      setSelectedSpares(new Set());
                    } else {
                      setSelectedSpares(new Set(sparePresets.map((s) => s.name)));
                    }
                  }}
                  className="text-xs text-ocean-200 hover:text-ocean-200 font-medium"
                >
                  {selectedSpares.size === sparePresets.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <ul className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                {sparePresets.map((preset) => {
                  const checked = selectedSpares.has(preset.name);
                  return (
                    <li
                      key={preset.name}
                      onClick={() => toggleSpare(preset.name)}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSpare(preset.name)}
                        className="h-4 w-4 rounded border-white/20 text-ocean-500 focus:ring-ocean-500 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-white/90">{preset.name}</span>
                          {preset.is_critical && (
                            <span className="text-xs font-medium text-red-300 bg-red-500/20 border border-red-400/20 rounded-full px-1.5 py-0.5">Critical</span>
                          )}
                        </div>
                        <div className="text-xs text-ocean-200/50">{preset.category} · {preset.quantity} {preset.unit}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="px-4 py-2.5 border-t border-white/8">
                <span className="text-xs text-ocean-200/60">{selectedSpares.size} of {sparePresets.length} items selected</span>
              </div>
            </div>

            <NavButtons
              onBack={() => setStep(2)}
              onNext={handleSeedInventory}
              nextLabel={selectedSpares.size > 0 ? `Add ${selectedSpares.size} items` : "Continue"}
              loading={loading}
              onSkip={() => setStep(4)}
            />
          </div>
        )}

        {/* ── Step 4: Feature Tour ────────────────────────────────── */}
        {step === 4 && (
          <div>
            <ProgressBar step={4} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-white">Here's what you can do</h2>
            <p className="text-sm text-ocean-200/70 mt-1 mb-5">
              NautIQ keeps everything in one place. Here's a quick look at the key features.
            </p>

            <div className="space-y-3">
              {[
                {
                  icon: MessageSquare,
                  iconCls: "bg-ocean-500/20 text-ocean-200 border border-ocean-500/20",
                  label: "AI Chat",
                  desc: "Just describe what happened — \"went sailing for 3 hours\" or \"changed the oil\" — and NautIQ logs it for you.",
                },
                {
                  icon: Wrench,
                  iconCls: "bg-amber-400/20 text-amber-300 border border-amber-400/20",
                  label: "Maintenance",
                  desc: "Track service history, get reminders when components are due, and see your boat's overall health score.",
                },
                {
                  icon: Package,
                  iconCls: "bg-green-400/20 text-green-300 border border-green-400/20",
                  label: "Inventory",
                  desc: "Know exactly what spares you have on board. Get alerts when stock runs low or critical items are missing.",
                },
                {
                  icon: Anchor,
                  iconCls: "bg-purple-400/20 text-purple-300 border border-purple-400/20",
                  label: "Trips",
                  desc: "Log trips with engine hours to keep accurate maintenance records based on actual usage, not just time.",
                },
              ].map(({ icon: Icon, iconCls, label, desc }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-4 flex gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconCls}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">{label}</div>
                    <div className="text-xs text-ocean-200/60 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Almost done!" />
          </div>
        )}

        {/* ── Step 5: All Done ────────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center">
            <ProgressBar step={5} total={TOTAL_STEPS} />
            <div className="w-16 h-16 rounded-2xl bg-green-500/80 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-900/40">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">You're all set!</h2>
            <p className="mt-2 text-sm text-ocean-200/70">
              {boatDisplayName} is ready to go. Start by logging your first trip or asking NautIQ anything.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-5 text-left space-y-3">
              <p className="text-xs font-semibold text-ocean-200/70 uppercase tracking-wide">Quick start tips</p>
              {[
                "Try asking: \"I went out for 2 hours this morning\"",
                "Log your first maintenance event on a component",
                "Check your health score under the Health tab",
                "Add more spares via Inventory → Add item",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-ocean-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">{tip}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { router.push("/chat"); router.refresh(); }}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-ocean-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-600 shadow-lg shadow-ocean-900/40"
            >
              <MessageSquare size={16} />
              Open NautIQ
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
