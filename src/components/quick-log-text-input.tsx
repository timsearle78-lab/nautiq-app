"use client";

import { useState } from "react";
import VoiceTripInput from "@/components/voice-trip-input";

type QuickLogTextInputProps = {
  defaultValue?: string;
};

export default function QuickLogTextInput({
  defaultValue = "",
}: QuickLogTextInputProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-3">
      <VoiceTripInput onTranscript={setValue} />

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
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>
    </div>
  );
}