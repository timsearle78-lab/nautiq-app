"use client";

import { useState } from "react";

type Props = {
  onHoursDetected: (hours: number) => void;
};

export default function EnginePanelUpload({ onHoursDetected }: Props) {
  const [detected, setDetected] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processFile(file: File) {
    setSelectedFileName(file.name);
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      // IMPORTANT: use the field name your API expects
      formData.append("image", file);

      const res = await fetch("/api/ai/engine-hours", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to process image.");
      }

      if (typeof data.engine_hours === "number") {
        setDetected(data.engine_hours);
        onHoursDetected(data.engine_hours);
      } else {
        setError("No engine hours detected from image.");
      }
    } catch (e) {
      console.error("Upload failed", e);
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
        className="rounded-xl border-2 border-dashed p-4 text-center transition hover:bg-gray-50"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-medium">
            📷 Upload or drop engine panel photo
          </div>

          <label className="cursor-pointer text-sm text-blue-600 underline">
            Choose file
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              className="hidden"
            />
          </label>

          {selectedFileName && (
            <div className="text-xs text-gray-500">{selectedFileName}</div>
          )}

          {uploading && (
            <div className="text-xs text-gray-400">Processing image…</div>
          )}
        </div>
      </div>

      {detected !== null && (
        <p className="text-sm text-green-700">
          Detected engine hours: {detected}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}