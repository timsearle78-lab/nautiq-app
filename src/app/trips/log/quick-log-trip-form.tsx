"use client";

import { useState, useEffect } from "react";
import { SubmitButton } from "@/components/submit-button";
import { saveTripAction } from "./actions";
import VoiceTripInput from "@/components/voice-trip-input";
import EnginePanelUpload from "@/components/engine-panel-upload";

type Boat = {
  id: string;
  name: string;
  type: string | null;
};

type TripDraft = {
  started_at: string | null;
  ended_at: string | null;
  engine_hours_delta: number | null;
  engine_hours_start: number | null;
  engine_hours_end: number | null;
  fuel_added_litres: number | null;
  notes: string;
  raw_input: string;
  issues_observed: string[];
  source: "ai_quick_log";
  confidence: number;
  fallback?: boolean;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function QuickLogTripForm({ boat }: { boat: Boat }) {
  const [source, setSource] = useState<"manual" | "ai_quick_log" | "voice_transcribed" | "panel_photo_assisted">("manual");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [issuesObserved, setIssuesObserved] = useState<string[]>([]);

  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [engineHoursDelta, setEngineHoursDelta] = useState("");
  const [engineHoursStart, setEngineHoursStart] = useState("");
  const [engineHoursEnd, setEngineHoursEnd] = useState("");
  const [fuelAddedLitres, setFuelAddedLitres] = useState("");
  const [notes, setNotes] = useState("");
  const [rawInput, setRawInput] = useState("");

  const [lastGeneratedRawInput, setLastGeneratedRawInput] = useState("");
  const [isEditingRawInput, setIsEditingRawInput] = useState(false);

  useEffect(() => {
    const trimmed = rawInput.trim();

    if (!isEditingRawInput) return;
    if (trimmed.length < 20) return;
    if (trimmed === lastGeneratedRawInput) return;

    const timeout = setTimeout(() => {
      runAIGeneration(trimmed);
    }, 800);

    return () => clearTimeout(timeout);
  }, [rawInput, isEditingRawInput, lastGeneratedRawInput]);
  
  function handleVoiceTranscript(transcript: string) {
    setRawInput(transcript);
    setSource("voice_transcribed");
    setAiError(null);

    // 🔥 auto-run AI
    runAIGeneration(transcript);
  }
  
  function handlePanelReading(hours: number | string) {
    const detectedEnd = Number(hours);
    if (!Number.isFinite(detectedEnd)) return;

    // 1. Always treat detected value as END reading
    setEngineHoursEnd(detectedEnd.toFixed(2));
    setSource("panel_photo_assisted");
    setAiError(null);

    const delta = Number(engineHoursDelta);

    // 2. If delta exists → calculate start
    if (Number.isFinite(delta) && delta >= 0) {
      const calculatedStart = detectedEnd - delta;

      if (calculatedStart >= 0) {
        setEngineHoursStart(calculatedStart.toFixed(2));
      }
    }

    // 3. Else if start exists → calculate delta
    else if (engineHoursStart) {
      const start = Number(engineHoursStart);

      if (Number.isFinite(start) && detectedEnd >= start) {
        setEngineHoursDelta((detectedEnd - start).toFixed(2));
      }
    }
  }
  
  async function runAIGeneration(input: string) {
    setAiError(null);

    if (!input.trim()) return;

    try {
      setAiLoading(true);

      const res = await fetch("/api/ai/trip-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw_input: input }),
      });

      const draft = await res.json();

      if (draft.fallback) {
        setAiError("AI unavailable. Please fill manually.");
        return;
      }

      setLastGeneratedRawInput(input);
      setIsEditingRawInput(false);
      setSource("ai_quick_log");
      setAiConfidence(draft.confidence ?? null);
      setIssuesObserved(draft.issues_observed ?? []);

      if (draft.started_at) setStartedAt(toDateTimeLocal(draft.started_at));
      if (draft.ended_at) setEndedAt(toDateTimeLocal(draft.ended_at));
      if (draft.engine_hours_delta !== null) setEngineHoursDelta(String(draft.engine_hours_delta));
      if (draft.engine_hours_start !== null) setEngineHoursStart(String(draft.engine_hours_start));
      if (draft.engine_hours_end !== null) setEngineHoursEnd(String(draft.engine_hours_end));
      if (draft.fuel_added_litres !== null) setFuelAddedLitres(String(draft.fuel_added_litres));
      if (draft.notes) setNotes(draft.notes);

    } catch (e) {
      setAiError("Failed to generate AI draft.");
    } finally {
      setAiLoading(false);
    }
  }  

  async function handleGenerateFromNotes() {
    setAiError(null);

    if (!rawInput.trim()) {
      setAiError("Enter raw input first.");
      return;
    }

    try {
      setAiLoading(true);

      const res = await fetch("/api/ai/trip-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw_input: rawInput }),
      });

      const draft: TripDraft | { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error("error" in draft && draft.error ? draft.error : "Failed to generate AI draft.");
      }

      const typedDraft = draft as TripDraft;

      if (typedDraft.fallback) {
        setAiError("AI unavailable. Please fill the form manually.");
        return;
      }

      setSource(typedDraft.source || "ai_quick_log");
      setAiConfidence(
        typeof typedDraft.confidence === "number" ? typedDraft.confidence : null
      );
      setIssuesObserved(Array.isArray(typedDraft.issues_observed) ? typedDraft.issues_observed : []);

      if (typedDraft.started_at) setStartedAt(toDateTimeLocal(typedDraft.started_at));
      if (typedDraft.ended_at) setEndedAt(toDateTimeLocal(typedDraft.ended_at));
      if (typedDraft.engine_hours_delta !== null) setEngineHoursDelta(String(typedDraft.engine_hours_delta));
      if (typedDraft.engine_hours_start !== null) setEngineHoursStart(String(typedDraft.engine_hours_start));
      if (typedDraft.engine_hours_end !== null) setEngineHoursEnd(String(typedDraft.engine_hours_end));
      if (typedDraft.fuel_added_litres !== null) setFuelAddedLitres(String(typedDraft.fuel_added_litres));
      if (typedDraft.notes) setNotes(typedDraft.notes);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Failed to generate AI draft.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form action={saveTripAction} className="space-y-6 rounded-2xl border p-5">
      <input type="hidden" name="boatId" value={boat.id} />
      <input type="hidden" name="source" value={source} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Boat</label>
        <div className="rounded-lg border px-3 py-2 text-sm">
          {boat.name} {boat.type ? `• ${boat.type}` : ""}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="rawInput" className="text-sm font-medium">
          Raw input
        </label>
        <textarea
          id="rawInput"
          name="rawInput"
          rows={4}
          value={rawInput}
          onChange={(e) => {
            setRawInput(e.target.value);
            setIsEditingRawInput(true);
            if (source === "ai_quick_log") {
              setSource("manual");
            }
          }}
          placeholder="Motored for about 1.2 hours. Added 10L diesel. Engine ran smoothly."
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap items-center gap-3">
          <VoiceTripInput onTranscript={handleVoiceTranscript} />
          <EnginePanelUpload onHoursDetected={handlePanelReading} />
        </div>        

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateFromNotes}
            disabled={aiLoading}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          >
            {aiLoading ? "Generating..." : "Generate from notes"}
          </button>

          {aiConfidence !== null && (
            <span className="text-xs text-muted-foreground">
              AI confidence: {aiConfidence.toFixed(2)}
            </span>
          )}
        </div>

        {aiError && <p className="text-sm text-red-600">{aiError}</p>}

        {issuesObserved.length > 0 && (
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium">Issues observed</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {issuesObserved.map((issue, index) => (
                <li key={`${issue}-${index}`}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startedAt" className="text-sm font-medium">
            Start time
          </label>
          <input
            id="startedAt"
            name="startedAt"
            type="datetime-local"
            required
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endedAt" className="text-sm font-medium">
            End time
          </label>
          <input
            id="endedAt"
            name="endedAt"
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="engineHoursDelta" className="text-sm font-medium">
            Engine hours used
          </label>
          <input
            id="engineHoursDelta"
            name="engineHoursDelta"
            type="number"
            step="0.1"
            min="0"
            value={engineHoursDelta}
            onChange={(e) => setEngineHoursDelta(e.target.value)}
            placeholder="1.2"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="engineHoursStart" className="text-sm font-medium">
            Engine start reading
          </label>
          <input
            id="engineHoursStart"
            name="engineHoursStart"
            type="number"
            step="0.1"
            min="0"
            value={engineHoursStart}
            onChange={(e) => setEngineHoursStart(e.target.value)}
            placeholder="123.4"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="engineHoursEnd" className="text-sm font-medium">
            Engine end reading
          </label>
          <input
            id="engineHoursEnd"
            name="engineHoursEnd"
            type="number"
            step="0.1"
            min="0"
            value={engineHoursEnd}
            onChange={(e) => setEngineHoursEnd(e.target.value)}
            placeholder="124.6"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="fuelAddedLitres" className="text-sm font-medium">
          Fuel added (litres)
        </label>
        <input
          id="fuelAddedLitres"
          name="fuelAddedLitres"
          type="number"
          step="0.1"
          min="0"
          value={fuelAddedLitres}
          onChange={(e) => setFuelAddedLitres(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Trip notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Motored for 1.2 hours. Smooth run. Added 10L diesel. No issues."
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton>Save trip</SubmitButton>
      </div>
    </form>
  );
}