"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Mic, Send, Camera, Wrench, Plus } from "lucide-react";
import MessageBubble from "./message-bubble";
import LogTripSheet from "./log-trip-sheet";

interface Boat {
  id: string;
  name: string;
  type?: string;
}

interface ChatInterfaceProps {
  boat: Boat;
  engineHours: number;
}

export default function ChatInterface({ boat, engineHours }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showTripSheet, setShowTripSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [tripSheetEngineHours, setTripSheetEngineHours] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { boatId: boat.id },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  async function handleVoice() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        try {
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData });
          if (res.ok) {
            const { transcript } = await res.json();
            if (transcript) {
              sendMessage({ text: transcript });
            }
          }
        } catch (err) {
          console.error("Transcription failed", err);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/ai/engine-hours", { method: "POST", body: formData });
      if (res.ok) {
        const { engine_hours } = await res.json();
        if (engine_hours != null) {
          setTripSheetEngineHours(engine_hours);
          setShowTripSheet(true);
        }
      }
    } catch (err) {
      console.error("Engine hours extraction failed", err);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const quickPrompts = [
    { label: "What's due?", text: "What maintenance is coming up?" },
    { label: "Spares check", text: "What spares am I low on?" },
    { label: "Boat health", text: "How's the boat doing overall?" },
  ];

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{boat.name}</h1>
          <p className="text-xs text-slate-400">{engineHours.toFixed(1)}h engine hours</p>
        </div>
        <div className="flex gap-2">
          {/* Photo input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="Scan engine panel"
          >
            <Camera size={18} />
          </button>
          <button
            onClick={() => setShowTripSheet(true)}
            className="flex items-center gap-1.5 rounded-full bg-ocean-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ocean-700"
          >
            <Plus size={14} />
            Log Trip
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-12">
            <div className="text-4xl">⚓</div>
            <div>
              <p className="text-base font-semibold text-slate-800">Hey, what&apos;s up?</p>
              <p className="text-sm text-slate-400 mt-1">
                Log a trip, check maintenance, or ask anything.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map(({ label, text }) => (
                <button
                  key={label}
                  onClick={() => sendMessage({ text })}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 shadow-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            boatId={boat.id}
          />
        ))}

        {isLoading && (
          <div className="flex gap-1 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
            <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5">
        <div className="flex items-end gap-2">
          <button
            onClick={handleVoice}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isRecording
                ? "border-red-300 bg-red-50 text-red-500"
                : "border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            {isRecording ? (
              <span className="h-3 w-3 rounded-sm bg-red-500 animate-pulse" />
            ) : (
              <Mic size={18} />
            )}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Message or describe a trip…"
            className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-ocean-500 focus:bg-white focus:outline-none"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-600 text-white transition hover:bg-ocean-700 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Quick used-a-part shortcut */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => sendMessage({ text: "I used a spare part during a trip" })}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
          >
            <Wrench size={12} />
            Used a part
          </button>
        </div>
      </div>

      {/* Log Trip bottom sheet */}
      {showTripSheet && (
        <LogTripSheet
          boatId={boat.id}
          prefillEngineHours={tripSheetEngineHours}
          onClose={() => {
            setShowTripSheet(false);
            setTripSheetEngineHours(null);
          }}
          onSaved={() => {
            setShowTripSheet(false);
            setTripSheetEngineHours(null);
            sendMessage({ text: "I just logged a trip." });
          }}
        />
      )}
    </div>
  );
}
