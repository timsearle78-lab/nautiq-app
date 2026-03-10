"use client";

import { useState } from "react";

type Props = {
  onHoursDetected: (hours: number) => void;
};

export default function EnginePanelUpload({ onHoursDetected }: Props) {
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState<number | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/ai/engine-hours", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setLoading(false);

    if (data.engine_hours) {
      setDetected(data.engine_hours);
      onHoursDetected(data.engine_hours);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Upload engine panel photo
      </label>

      <input type="file" accept="image/*" onChange={handleFile} />

      {loading && <p className="text-sm text-neutral-500">Reading panel…</p>}

      {detected && (
        <p className="text-sm text-green-700">
          Detected engine hours: {detected}
        </p>
      )}
    </div>
  );
}