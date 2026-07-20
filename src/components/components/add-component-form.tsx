"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import SaveSuccessBanner from "@/components/ui/save-success-banner";
import {
  createComponent,
  type AddComponentActionState,
} from "@/app/(app)/components/new/actions";

type SystemOption = {
  id: string;
  name: string;
};

type AiSuggestion = {
  service_interval_months: number | null;
  service_interval_years: number | null;
  service_interval_engine_hours: number | null;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  servicing_notes: string;
};

const initialState: AddComponentActionState = {};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function AddComponentForm({
  boatId,
  systems,
  boatType,
  noRedirect = false,
  onSuccess,
  defaultName,
  defaultSystemId,
  defaultInstallDate,
}: {
  boatId: string;
  systems: SystemOption[];
  boatType?: string;
  noRedirect?: boolean;
  onSuccess?: (componentId: string) => void;
  defaultName?: string;
  defaultSystemId?: string;
  defaultInstallDate?: string;
}) {
  const [state, formAction, pending] = useActionState(createComponent, initialState);

  // Controlled interval fields (so AI can populate them)
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [days, setDays] = useState("");
  const [engineHours, setEngineHours] = useState("");
  const [notes, setNotes] = useState("");
  const [componentName, setComponentName] = useState(defaultName ?? "");
  const [systemId, setSystemId] = useState(defaultSystemId ?? "");

  // AI state
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "error" | "ratelimit">("idle");
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-trigger AI lookup when a default name is supplied
  const didAutoLookup = useRef(false);
  useEffect(() => {
    if (defaultName && !didAutoLookup.current) {
      didAutoLookup.current = true;
      lookUpIntervals(defaultName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.componentId) {
      const t = setTimeout(() => onSuccess?.(state.componentId!), 1200);
      return () => clearTimeout(t);
    }
  }, [state.componentId, onSuccess]);

  async function lookUpIntervals(name: string) {
    if (name.trim().length < 3) return;
    setAiStatus("loading");
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/ai/component-intervals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentName: name, boatType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAiStatus(body?.error === "RATE_LIMIT" ? "ratelimit" : "error");
        return;
      }
      const data: AiSuggestion = await res.json();
      setAiSuggestion(data);
      setAiStatus("done");
      // Auto-fill fields
      setYears(data.service_interval_years != null ? String(data.service_interval_years) : "");
      setMonths(data.service_interval_months != null ? String(data.service_interval_months) : "");
      setEngineHours(data.service_interval_engine_hours != null ? String(data.service_interval_engine_hours) : "");
      if (data.servicing_notes) setNotes(data.servicing_notes);
    } catch {
      setAiStatus("error");
    }
  }

  function handleNameChange(value: string) {
    setComponentName(value);
    // Clear previous suggestion when name changes
    if (aiStatus !== "idle" && aiStatus !== "ratelimit") {
      setAiStatus("idle");
      setAiSuggestion(null);
    }
    // Debounce AI lookup
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => lookUpIntervals(value), 900);
    }
  }

  function clearAiSuggestion() {
    setAiSuggestion(null);
    setAiStatus("idle");
    setYears("");
    setMonths("");
    setDays("");
    setEngineHours("");
    setNotes("");
  }

  const confidenceColors = {
    high:   "text-green-700 bg-green-50 border-green-200",
    medium: "text-amber-700 bg-amber-50 border-amber-200",
    low:    "text-slate-600 bg-slate-50 border-slate-200",
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="boat_id" value={boatId} />
      {noRedirect && <input type="hidden" name="no_redirect" value="1" />}

      {/* Component name + AI trigger */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Component name</label>
        <div className="relative">
          <input
            name="name"
            required
            value={componentName}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`${inputCls} pr-10`}
            placeholder="e.g. Raw water impeller"
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {aiStatus === "loading" && (
              <svg className="h-4 w-4 animate-spin text-ocean-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {aiStatus === "done" && (
              <Sparkles size={15} className="text-ocean-500" />
            )}
          </div>
        </div>

        {/* AI status messages */}
        {aiStatus === "loading" && (
          <p className="mt-1.5 text-xs text-ocean-600 flex items-center gap-1.5">
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            AI is looking up recommended service intervals…
          </p>
        )}
        {aiStatus === "error" && (
          <p className="mt-1.5 text-xs text-slate-400">Couldn't look up intervals — fill in manually.</p>
        )}
        {aiStatus === "ratelimit" && (
          <p className="mt-1.5 text-xs text-amber-600">Daily AI limit reached — fill in intervals manually.</p>
        )}
      </div>

      {/* AI suggestion banner */}
      {aiSuggestion && aiStatus === "done" && (
        <div className={`rounded-xl border px-3 py-2.5 text-xs ${confidenceColors[aiSuggestion.confidence]}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles size={13} className="flex-shrink-0" />
              <span className="font-semibold">AI suggested intervals</span>
              <span className="opacity-60 capitalize">({aiSuggestion.confidence} confidence)</span>
            </div>
            <button type="button" onClick={clearAiSuggestion} className="flex-shrink-0 opacity-50 hover:opacity-80 transition">
              <X size={13} />
            </button>
          </div>
          <p className="mt-1 opacity-80 leading-relaxed">{aiSuggestion.reasoning}</p>
        </div>
      )}

      {/* System */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">System <span className="text-red-500">*</span></label>
        <select
          name="system_id"
          className={inputCls}
          value={systemId}
          onChange={(e) => setSystemId(e.target.value)}
          required
        >
          <option value="">Select a system…</option>
          {systems.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </select>
      </div>

      {/* Install date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Install date</label>
        <input
          name="install_date"
          type="date"
          className={inputCls}
          defaultValue={defaultInstallDate ?? ""}
        />
      </div>

      {/* Time-based interval */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700 flex items-center gap-1.5">
          Service interval — time
          {aiStatus === "done" && (aiSuggestion?.service_interval_months || aiSuggestion?.service_interval_years) && (
            <span className="text-xs font-normal text-ocean-600 flex items-center gap-0.5">
              <Sparkles size={11} /> AI filled
            </span>
          )}
        </legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Years</label>
            <input
              name="service_interval_years"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              placeholder="0"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Months</label>
            <input
              name="service_interval_months"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              placeholder="0"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Days</label>
            <input
              name="service_interval_days"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              placeholder="0"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Engine hours interval */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
          Service interval — engine hours
          {aiStatus === "done" && aiSuggestion?.service_interval_engine_hours != null && (
            <span className="text-xs font-normal text-ocean-600 flex items-center gap-0.5">
              <Sparkles size={11} /> AI filled
            </span>
          )}
        </label>
        <input
          name="service_interval_engine_hours"
          type="number"
          min="0"
          step="0.1"
          className={inputCls}
          placeholder="e.g. 200"
          value={engineHours}
          onChange={(e) => setEngineHours(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1.5">
          Notes
          {aiStatus === "done" && aiSuggestion?.servicing_notes && (
            <span className="text-xs font-normal text-ocean-600 flex items-center gap-0.5">
              <Sparkles size={11} /> AI filled
            </span>
          )}
        </label>
        <textarea
          name="notes"
          rows={notes ? 6 : 3}
          className={inputCls}
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state.componentId && <SaveSuccessBanner message="Component created" />}

      <button
        type="submit"
        disabled={pending || !!state.componentId || aiStatus === "loading"}
        className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {pending ? "Saving…" : aiStatus === "loading" ? "Looking up intervals…" : "Create component"}
      </button>
    </form>
  );
}
