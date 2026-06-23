"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Mic, Send, Plus, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, PackagePlus, PackageMinus, ScanLine } from "lucide-react";
import { HealthGauge } from "@/components/ui/health-gauge";
import Link from "next/link";
import MessageBubble from "./message-bubble";
import LogTripSheet from "./log-trip-sheet";
import ScanConfirmSheet, { type ScanResult } from "./scan-confirm-sheet";
import LogMaintenanceSheet from "@/components/components/log-maintenance-sheet";
import TripTimerButton from "@/components/nav/trip-timer-button";

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
  components: { id: string; name: string }[];
  inventoryItems: { id: string; name: string; quantity: number; unit: string | null; minimum_quantity: number | null }[];
}

function tokenize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}
function overlapScore(a: string, b: string) {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  let hits = 0;
  for (const t of ta) if (tb.has(t)) hits++;
  return ta.size === 0 ? 0 : hits / ta.size;
}

function formatDate(v: string | null) {
  if (!v) return null;
  return new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function HealthBanner({ healthScore, overdueCount, dueSoonCount, okCount, urgentItems }: {
  healthScore: number;
  overdueCount: number;
  dueSoonCount: number;
  okCount: number;
  urgentItems: UrgentItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  const isRed = overdueCount > 0 || healthScore < 50;
  const isAmber = !isRed && healthScore < 75;
  const scoreColor = isRed ? "text-red-600" : isAmber ? "text-amber-600" : "text-green-600";
  const scoreBorder = isRed ? "border-red-200 bg-red-50" : isAmber ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50";

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

export default function ChatInterface({ boat, engineHours, healthScore, overdueCount, dueSoonCount, okCount, urgentItems, components, inventoryItems }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showTripSheet, setShowTripSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inventoryScanRef = useRef<HTMLInputElement>(null);
  const [scanningInventory, setScanningInventory] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showMaintenanceSheet, setShowMaintenanceSheet] = useState(false);

  const router = useRouter();
  const onTripSaved = useCallback(() => router.refresh(), [router]);

  const { messages, sendMessage, status, error } = useChat({
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

  function handleVoice() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-NZ";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim();
      if (transcript) sendMessage({ text: transcript });
    };
    recognition.onerror = (e) => {
      console.error("Speech recognition error", e.error);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  async function handleInventoryScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningInventory(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/ai/inventory-scan", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && !data.error) {
        const matchedItem = inventoryItems
          .map((item) => ({ item, score: Math.max(overlapScore(data.itemName, item.name), overlapScore(item.name, data.itemName)) }))
          .filter((x) => x.score >= 0.5)
          .sort((a, b) => b.score - a.score)[0]?.item ?? null;

        const suggestedComponentId = components
          .map((c) => ({ c, score: Math.max(overlapScore(data.itemName, c.name), overlapScore(c.name, data.itemName)) }))
          .filter((x) => x.score >= 0.4)
          .sort((a, b) => b.score - a.score)[0]?.c.id ?? null;

        setScanResult({
          itemName: data.itemName ?? "Scanned item",
          quantity: data.quantity ?? 1,
          unit: data.unit ?? null,
          category: data.category ?? null,
          manufacturer: data.manufacturer ?? null,
          sku: data.sku ?? null,
          is_critical: data.is_critical ?? false,
          notes: data.notes ?? null,
          confidence: data.confidence ?? "medium",
          matchedItem,
          suggestedComponentId,
        });
      } else {
        sendMessage({ text: "I just scanned a spare part — can you help me update inventory?" });
      }
    } catch {
      sendMessage({ text: "I just scanned a spare part — can you help me update inventory?" });
    } finally {
      setScanningInventory(false);
      if (inventoryScanRef.current) inventoryScanRef.current.value = "";
    }
  }


  const quickPrompts = [
    { label: "What's due?", text: "What maintenance is coming up?" },
    { label: "Spares check", text: "What spares am I low on?" },
    { label: "Boat health", text: "How's the boat doing overall?" },
  ];

  return (
    // h-[100dvh] minus AppHeader (h-14=3.5rem) minus BottomNav (h-16=4rem)
    <div className="flex flex-col h-[calc(100dvh-3.5rem-4rem)]">
      {/* Sub-header: quick actions */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 shrink-0">
        <TripTimerButton boatId={boat.id} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMaintenanceSheet(true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Plus size={13} />
            Log Maintenance
          </button>
          <button
            onClick={() => setShowTripSheet(true)}
            className="flex items-center gap-1.5 rounded-full btn-primary px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            Log Trip
          </button>
        </div>
      </header>

      {/* Messages / health area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state: gauge + stats + maintenance */
          <div className="px-4 pt-5 pb-4 space-y-4">
            {/* Health score card with gauge */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between gap-4">
                <HealthGauge score={healthScore} overdueCount={overdueCount} size={130} />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-3 text-center">
                    <div className="text-xl font-bold text-red-600">{overdueCount}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Overdue</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-3 text-center">
                    <div className="text-xl font-bold text-amber-600">{dueSoonCount}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Due soon</div>
                  </div>
                  <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-3 text-center">
                    <div className="text-xl font-bold text-green-600">{okCount}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Healthy</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                    <div className="text-xl font-bold text-slate-500">{engineHours.toFixed(1)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Engine hrs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Urgent items or all clear */}
            {urgentItems.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                      className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 active:bg-slate-50"
                    >
                      <AlertTriangle size={15} className={`flex-shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
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
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 flex items-center gap-3">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-green-800">All clear</div>
                  <div className="text-xs text-green-700 mt-0.5">No overdue or upcoming maintenance in the next 90 days.</div>
                </div>
              </div>
            )}

            {/* Quick prompts */}
            <div className="pt-1 text-center space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Ask the assistant</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map(({ label, text }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage({ text })}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 active:bg-slate-50 shadow-sm"
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
                <MessageBubble key={message.id} message={message} boatId={boat.id} onTripSaved={onTripSaved} />
              ))}
              {isLoading && (
                <div className="flex gap-1 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div className="text-sm text-red-700 space-y-1">
                    <span className="font-medium">Something went wrong.</span>
                    <pre className="text-xs text-red-600 whitespace-pre-wrap break-all font-mono bg-red-100 rounded p-2 mt-1">{error.message}</pre>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-3 pt-3 pb-2">
        {/* Main input row */}
        <div className="flex items-end gap-2">
          {/* Prominent voice button */}
          <button
            onClick={handleVoice}
            className="shrink-0 flex items-center justify-center rounded-full transition-all"
            style={{
              width: 48,
              height: 48,
              background: isRecording
                ? "#D83A3A"
                : "linear-gradient(135deg, #15A0D6, #0B7EB8)",
              boxShadow: isRecording
                ? "0 4px 14px rgba(216,58,58,.35)"
                : "0 6px 16px rgba(11,126,184,.32)",
              color: "#fff",
              border: "none",
              flexShrink: 0,
            }}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? (
              <span className="h-3.5 w-3.5 rounded-sm bg-white animate-pulse" />
            ) : (
              <Mic size={20} />
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
            className="flex shrink-0 items-center justify-center rounded-full btn-primary text-white transition disabled:opacity-40"
            style={{ width: 40, height: 40 }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Quick action chips */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5">
          <input
            ref={inventoryScanRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInventoryScan}
          />
          <button
            onClick={() => inventoryScanRef.current?.click()}
            disabled={scanningInventory}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ScanLine size={12} />
            {scanningInventory ? "Scanning…" : "Scan item"}
          </button>
          <button
            onClick={() => sendMessage({ text: "I just bought some spare parts" })}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700 hover:bg-green-100"
          >
            <PackagePlus size={12} />
            Restock item
          </button>
          <button
            onClick={() => sendMessage({ text: "I just used a spare part" })}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            <PackageMinus size={12} />
            Used item
          </button>
        </div>
      </div>

      {showMaintenanceSheet && (
        <LogMaintenanceSheet
          boatId={boat.id}
          componentId={null}
          components={components}
          inventoryOptions={inventoryItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit }))}
          onClose={() => setShowMaintenanceSheet(false)}
          onSaved={() => { setShowMaintenanceSheet(false); router.refresh(); }}
        />
      )}

      {scanResult && (
        <ScanConfirmSheet
          boatId={boat.id}
          scanResult={scanResult}
          components={components}
          onClose={() => setScanResult(null)}
          onSaved={() => { setScanResult(null); router.refresh(); }}
        />
      )}

      {showTripSheet && (
        <LogTripSheet
          boatId={boat.id}
          onClose={() => setShowTripSheet(false)}
          onSaved={() => { setShowTripSheet(false); onTripSaved(); }}
        />
      )}
    </div>
  );
}
