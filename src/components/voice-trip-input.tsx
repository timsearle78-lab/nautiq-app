"use client";

import { useState } from "react";

type VoiceTripInputProps = {
  onTranscript: (transcript: string) => void;
};

export default function VoiceTripInput({
  onTranscript,
}: VoiceTripInputProps) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startRecording() {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });

          const formData = new FormData();
          formData.append("audio", blob, "trip.webm");

          const response = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || "Failed to transcribe audio.");
          }

          if (data?.transcript) {
            onTranscript(data.transcript);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to transcribe audio."
          );
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start recording."
      );
    }
  }

  function stopRecording() {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-md border px-3 py-2 text-sm"
          >
            🎤 Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-md border bg-red-600 px-3 py-2 text-sm text-white"
          >
            Stop
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}