"use client";

import { useRef, useState } from "react";
import { Mic } from "lucide-react";

interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function VoiceTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
}: VoiceTextareaProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function toggleVoice() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    const r = new SR();
    r.lang = navigator.language || "en-NZ";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) onChange(value ? `${value} ${transcript}` : transcript);
    };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    r.start();
    recognitionRef.current = r;
    setIsRecording(true);
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-base focus:border-ocean-500 focus:outline-none resize-none ${className}`}
      />
      <button
        type="button"
        onClick={toggleVoice}
        title={isRecording ? "Stop recording" : "Voice input"}
        className="absolute right-2.5 bottom-2.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        style={{
          background: isRecording ? "#D83A3A" : "linear-gradient(135deg,#15A0D6,#0B7EB8)",
          color: "#fff",
          border: "none",
          boxShadow: isRecording ? "0 2px 8px rgba(216,58,58,.35)" : "0 2px 8px rgba(11,126,184,.28)",
        }}
      >
        {isRecording ? (
          <span className="h-2 w-2 rounded-sm bg-white animate-pulse" />
        ) : (
          <Mic size={13} />
        )}
      </button>
    </div>
  );
}
