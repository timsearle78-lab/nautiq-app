"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Mic, Send, Camera, Wrench, Plus, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import MessageBubble from "./message-bubble";
import LogTripSheet from "./log-trip-sheet";

interface Boat {
  id: string;
  name: string;
  type?: string;
}

type UrgentItem = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  predicted_due_date: string | null;
  status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
};

interface ChatInterfaceProps {
  boat: Boat;
  engineHours: number;
  healthScore: number;
  overdueCount: number;
  dueSoonCount: number;
  okCount: number;
  urgentItems: UrgentItem[];
}

function formatDate(v: string | null) {
  if (!v) return null;
  return new Date(v).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function HealthBanner({ healthScore, overdueCount, dueSoonCount, okCount, urgentItems }: {
  healthScore: number;
  overdueCount: number;
  dueSoonCount: number;
  okCount: number;
  urgentItems: UrgentItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    healthScore >= 80 ? "text-green-600" :
    healthScore >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBorder =
    healthScore >= 80 ? "border-green-200 bg-green-50" :
    healthScore >= 50 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";

  return (
    <div className={`rounded-xl border mx-1 mb-1 overflow-hidden ${scoreBorder}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-4">
          <div>
            <span className={`text-2xl font-bold ${scoreColor}`}>{healthScore}</span>
            <span className="text-xs text-slate-500 ml-1">/ 100</span>
          </div>
          <div className="flex gap-3 text-xs">
            {overdueCount > 0 && <span className="font-medium text-red-600">{overdueCount} overdue</span>}
            {dueSoonCount > 0 && <span className="font-medium text-amber-600">{dueSoonCount} due soon</span>}
            <span className="text-green-600">{okCount} healthy</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 bg-white">
          {urgentItems.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">All clear — no overdue or upcoming maintenance.</span>
            </div>
          ) : (
            urgentItems.map((item) => {
              const isOverdue = item.status === "overdue";
              const due = formatDate(item.predicted_due_date);
              return (
                <Link
                  key={item.component_id}
                  href={`/components/${item.component_id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <AlertTriangle size={15} className={isOverdue ? "text-red-500 flex-shrink-0" : "text-amber-500 flex-shrink-0"} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate">{item.component_name}</div>
                    <div className="text-xs text-slate-400">{item.system_name ?? "—"}</div>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${isOverdue ? "text-red-600" : "text-amber-600"}`}>
                    {isOverdue ? "Overdue" : due ? `Due ${due}` : "Due soon"}
                  </span>
                </Link>
              );
            })
          )}
          <div className="px-4 py-2 border-t border-slate-100">
            <Link href="/maintenance" className="text-xs text-ocean-600 hover:text-ocean-700 font-medium">
              Full maintenance view →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatInterface({ boat, engineHours, healthScore, overdueCount, dueSoonCount, okCount, urgentItems }: ChatInterfaceProps) {
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
            if (transcript) sendMessage({ text: transcript });
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const quickPrompts = [
    { label: "What's due?", text: "What maintenance is coming up?" },
    { label: "Spares check", text: "What spares am I low on?" },
    { label: "Boat health", text: "How's the boat doing overall?" },
  ];

  const scoreColor =
    healthScore >= 80 ? "text-green-600" :
    healthScore >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg =
    healthScore >= 80 ? "bg-green-50 border-green-200" :
    healthScore >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    // h-[100dvh] minus AppHeader (h-14=3.5rem) minus BottomNav (h-16=4rem)
    <div className="flex flex-col h-[calc(100dvh-3.5rem-4rem)]">
      {/* Sub-header: engine hours + quick actions */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shrink-0">
        <p className="text-xs text-slate-500 font-medium">{engineHours.toFixed(1)}h engine hours</p>
        <div className="flex gap-2">
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

      {/* Messages / health area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state: full health summary */
          <div className="px-4 pt-5 pb-4 space-y-4">
            {/* Health score card */}
            <div className={`rounded-xl border p-5 ${scoreBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-600">Health score</div>
                  <div className={`text-5xl font-bold mt-1 ${scoreColor}`}>{healthScore}</div>
                  <div className="text-xs text-slate-500 mt-1">out of 100</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-white/80 px-3 py-2">
                    <div className="text-lg font-semibold text-red-600">{overdueCount}</div>
                    <div className="text-xs text-slate-500">Overdue</div>
                  </div>
                  <div className="rounded-lg bg-white/80 px-3 py-2">
                    <div className="text-lg font-semibold text-amber-600">{dueSoonCount}</div>
                    <div className="text-xs text-slate-500">Due soon</div>
                  </div>
                  <div className="rounded-lg bg-white/80 px-3 py-2">
                    <div className="text-lg font-semibold text-green-600">{okCount}</div>
                    <div className="text-xs text-slate-500">Healthy</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Urgent items or all clear */}
            {urgentItems.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">Needs attention</h2>
                  <Link href="/maintenance" className="text-xs text-ocean-600 hover:text-ocean-700 font-medium">View all →</Link>
                </div>
                {urgentItems.map((item) => {
                  const isOverdue = item.status === "overdue";
                  const due = formatDate(item.predicted_due_date);
                  return (
                    <Link
                      key={item.component_id}
                      href={`/components/${item.component_id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <AlertTriangle size={16} className={`flex-shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">{item.component_name}</div>
                        <div className="text-xs text-slate-400">{item.system_name ?? "—"}</div>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 rounded-full border px-2 py-0.5 ${
                        isOverdue ? "text-red-600 bg-red-50 border-red-200" : "text-amber-600 bg-amber-50 border-amber-200"
                      }`}>
                        {isOverdue ? "Overdue" : due ? `Due ${due}` : "Due soon"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-green-800">All clear</div>
                  <div className="text-xs text-green-700">No overdue or upcoming maintenance in the next 90 days.</div>
                </div>
              </div>
            )}

            {/* Quick prompts */}
            <div className="pt-2 text-center space-y-3">
              <p className="text-sm font-medium text-slate-600">Ask the assistant</p>
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
          </div>
        ) : (
          /* Active chat: compact health banner + messages */
          <div className="flex flex-col">
            <div className="px-3 pt-3">
              <HealthBanner
                healthScore={healthScore}
                overdueCount={overdueCount}
                dueSoonCount={dueSoonCount}
                okCount={okCount}
                urgentItems={urgentItems}
              />
            </div>
            <div className="px-4 py-3 space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} boatId={boat.id} />
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
          </div>
        )}
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
            placeholder="Ask anything or describe a trip…"
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

      {showTripSheet && (
        <LogTripSheet
          boatId={boat.id}
          prefillEngineHours={tripSheetEngineHours}
          onClose={() => { setShowTripSheet(false); setTripSheetEngineHours(null); }}
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
