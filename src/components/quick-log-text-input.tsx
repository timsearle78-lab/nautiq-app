"use client";

import { useState } from "react";
import VoiceTripInput from "@/components/voice-trip-input";
import EnginePanelUpload from "@/components/engine-panel-upload";

type QuickLogTextInputProps = {
  defaultValue?: string;
};

export default function QuickLogTextInput({
  defaultValue = "",
}: QuickLogTextInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [engineHours, setEngineHours] = useState("");

  return (
    <div className="space-y-3">
      <VoiceTripInput onTranscript={setValue} />

      <EnginePanelUpload
        onHoursDetected={(hours) => {
          setEngineHours(String(hours));
        }}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">
          Describe your trip
        </label>
        <textarea
          name="raw_input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={6}
          placeholder="Example: Wednesday night race, motored about 1 hour at 3000 rpm, topped up diesel 3 litres, no issues."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
          required
        />
      </div>
            
      <div>
        <label className="mb-1 block text-sm font-medium">
          Engine hours (end of trip)
        </label>

        <input
          type="number"
          step="0.1"
          name="engine_hours_end"
          value={engineHours}
          onChange={(e) => setEngineHours(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
        />
      </div> 
      
    </div>
  );
}