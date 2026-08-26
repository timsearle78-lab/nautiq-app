"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Mic, Send, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Camera, FolderOpen, X, RotateCcw } from "lucide-react";
import { HealthGauge } from "@/components/ui/health-gauge";
import Link from "next/link";
import MessageBubble from "./message-bubble";
import LogTripSheet from "./log-trip-sheet";
import ScanConfirmSheet, { type ScanResult } from "./scan-confirm-sheet";
import LogMaintenanceSheet from "@/components/components/log-maintenance-sheet";
import NautiqSpinner from "@/components/ui/nautiq-spinner";
import WhatsNewCard from "@/components/chat/whats-new-card";
import GreetingCard from "@/components/chat/greeting-card";
import MissingComponentsCard from "@/components/chat/missing-components-card";
import { NoTripsCard, NoInventoryCard } from "@/components/chat/activation-cards";
import MaintenanceDraftCard from "@/components/chat/maintenance-draft-card";
import EmailTripDraftCard from "@/components/chat/email-trip-draft-card";
import type { SuggestedComponent } from "@/lib/component-suggestions";
import type { MaintenanceDraft } from "@/lib/maintenance-drafts";
import type { TripDraftFromEmail } from "@/lib/trip-drafts";

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
  inventoryItems: { id: string; name: string; quantity: number; unit: string | null; minimum_quantity: number | null; is_critical: boolean }[];
  missingSuggestions: SuggestedComponent[];
  pendingDrafts: MaintenanceDraft[];
  pendingTripDrafts: TripDraftFromEmail[];
  hideGreeting: boolean;
  hideWhatsNew: boolean;
  hasTrips: boolean;
  hasInventory: boolean;
}

function useCountUp(target: number, decimals = 0, duration = 650) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(decimals > 0 ? parseFloat((eased * target).toFixed(decimals)) : Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, decimals, duration]);
  return decimals > 0 ? value.toFixed(decimals) : value;
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

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function getHealthHeadline(score: number, overdueCount: number) {
  if (overdueCount > 0 || score < 60) return "Needs attention.";
  if (score < 80) return "Could be worse.";
  return "Ship shape.";
}

function NavyHero({ boat, healthScore, overdueCount, engineHours }: {
  boat: Boat;
  healthScore: number;
  overdueCount: number;
  engineHours: number;
}) {
  return (
    <div className="w-full px-4 pt-5 pb-5" style={{ background: "#0B2942" }}>
      <div className="flex items-center gap-4">
        {/* Gauge */}
        <Link href="/health" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <HealthGauge score={healthScore} overdueCount={overdueCount} size={110} />
        </Link>
        {/* Right side */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {getTimeGreeting()}
          </p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1, marginTop: 2 }}>
            {getHealthHeadline(healthScore, overdueCount)}
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#FFC730", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 6 }}>
            BOAT HEALTH
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
            {overdueCount > 0
              ? `${overdueCount} overdue item${overdueCount !== 1 ? "s" : ""}`
              : "All maintenance up to date"}
          </p>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {engineHours > 0 && (
              <span
                className="rounded-full px-2.5 py-1"
                style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                {engineHours.toFixed(1)}h engine
              </span>
            )}
            <Link
              href="/health"
              className="rounded-full px-2.5 py-1 hover:opacity-80 transition-opacity"
              style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,199,48,0.15)", color: "#FFC730" }}
            >
              View health →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
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
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/health" className="flex items-baseline gap-1 hover:opacity-80 transition-opacity">
            <span className={`text-2xl font-bold ${scoreColor}`}>{healthScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </Link>
          <div className="flex gap-3 text-xs">
            {overdueCount > 0 && <span className="font-medium text-red-600">{overdueCount} overdue</span>}
            {dueSoonCount > 0 && <span className="font-medium text-amber-600">{dueSoonCount} due soon</span>}
            <span className="text-green-600">{okCount} healthy</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1 -mr-1 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

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
          <div className="px-4 py-2 border-t border-slate-100 flex gap-4">
            <Link href="/health" className="text-xs text-ocean-600 hover:text-ocean-700 font-medium">
              Health breakdown →
            </Link>
            <Link href="/maintenance" className="text-xs text-slate-500 hover:text-ocean-600 font-medium">
              Maintenance timeline →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatInterface({ boat, engineHours, healthScore, overdueCount, dueSoonCount, okCount, urgentItems, components, inventoryItems, missingSuggestions, pendingDrafts: initialDrafts, pendingTripDrafts: initialTripDrafts, hideGreeting, hideWhatsNew, hasTrips, hasInventory }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showTripSheet, setShowTripSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inventoryScanRef = useRef<HTMLInputElement>(null);
  const inventoryScanCameraRef = useRef<HTMLInputElement>(null);
  const [scanningInventory, setScanningInventory] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showScanPicker, setShowScanPicker] = useState(false);
  const [drafts, setDrafts] = useState<MaintenanceDraft[]>(initialDrafts);
  const [tripDrafts, setTripDrafts] = useState<TripDraftFromEmail[]>(initialTripDrafts);

  const router = useRouter();
  const onTripSaved = useCallback(() => router.refresh(), [router]);

  const lowCriticalItems = inventoryItems.filter(
    (i) => i.minimum_quantity != null && i.quantity <= i.minimum_quantity && i.is_critical
  );
  const lowStockItems = inventoryItems.filter(
    (i) => i.minimum_quantity != null && i.quantity <= i.minimum_quantity
  );
  const lowCriticalCount = lowCriticalItems.length;
  const lowStockCount = lowStockItems.length;

  // Animated display values for dashboard tiles
  const animOverdue = useCountUp(overdueCount);
  const animDueSoon = useCountUp(dueSoonCount);
  const animInventory = useCountUp(lowCriticalCount > 0 ? lowCriticalCount : lowStockCount > 0 ? lowStockCount : okCount);
  const animEngineHours = useCountUp(engineHours, 1);
  const animHealthScore = useCountUp(healthScore);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { boatId: boat.id },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset chat from global menu
  useEffect(() => {
    const reset = () => setMessages([]);
    window.addEventListener("nautiq:reset-chat", reset);
    return () => window.removeEventListener("nautiq:reset-chat", reset);
  }, [setMessages]);

  // Handle actions triggered by navigation from another page
  useEffect(() => {
    const action = sessionStorage.getItem("nautiq_pending_action");
    if (!action) return;
    sessionStorage.removeItem("nautiq_pending_action");
    if (action === "scan") { setShowScanPicker(true); return; }
    // sendMessage needs the chat transport to settle after mount
    const timer = setTimeout(() => {
      if (action === "restock") sendMessage({ text: "I just bought some spare parts" });
      if (action === "used") sendMessage({ text: "I just used a spare part" });
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a stable ref to sendMessage so event handlers never go stale
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // Handle actions dispatched when already on the chat page
  useEffect(() => {
    const onRestock = () => sendMessageRef.current({ text: "I just bought some spare parts" });
    const onUsed = () => sendMessageRef.current({ text: "I just used a spare part" });
    const onScan = () => setShowScanPicker(true);
    window.addEventListener("nautiq:action-restock", onRestock);
    window.addEventListener("nautiq:action-used", onUsed);
    window.addEventListener("nautiq:action-scan", onScan);
    return () => {
      window.removeEventListener("nautiq:action-restock", onRestock);
      window.removeEventListener("nautiq:action-used", onUsed);
      window.removeEventListener("nautiq:action-scan", onScan);
    };
  }, []);

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
    e.target.style.height = e.target.scrollHeight + "px";
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

        const itemName = data.itemName ?? "Scanned item";
        const scanMsg = matchedItem
          ? `📷 Scanned image — identified **${itemName}**. This matches **${matchedItem.name}** already in your inventory (${matchedItem.quantity}${matchedItem.unit ? ` ${matchedItem.unit}` : ""} in stock). Update the quantity below.`
          : `📷 Scanned image — identified **${itemName}**. This isn't in your inventory yet. Add it below.`;
        setMessages((prev) => [
          ...prev,
          { id: `scan-${Date.now()}`, role: "assistant", content: scanMsg, parts: [{ type: "text", text: scanMsg }] },
        ]);
        setScanResult({
          itemName,
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
        console.error("Scan failed:", data);
        sendMessage({ text: "I just scanned an item — can you help me update inventory?" });
      }
    } catch (err) {
      console.error("Scan error:", err);
      sendMessage({ text: "I just scanned an item — can you help me update inventory?" });
    } finally {
      setScanningInventory(false);
      if (inventoryScanRef.current) inventoryScanRef.current.value = "";
    }
  }


  const quickPrompts = [
    { label: "What's due?", text: "What maintenance is coming up?" },
    { label: "Spares check", text: "What spares am I low on?" },
    { label: "Boat health", text: "How's the boat doing overall?" },
    { label: "Boat report", text: "Download a boat report" },
  ];

  return (
    // h-[100dvh] minus AppHeader (h-14=3.5rem) minus BottomNav (h-16=4rem)
    <div className="flex flex-col h-[calc(100dvh-3.5rem-4rem)]">
      {scanningInventory && <NautiqSpinner overlay />}
      {/* Messages / health area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state: navy hero + stats + maintenance */
          <div className="pb-4 space-y-4">
            {/* Navy hero section — always first */}
            <NavyHero
              boat={boat}
              healthScore={animHealthScore as number}
              overdueCount={overdueCount}
              engineHours={engineHours}
            />
            {/* Action cards below health */}
            {tripDrafts.map((draft) => (
              <div key={draft.id} className="px-4">
                <EmailTripDraftCard
                  draft={draft}
                  onDone={() => setTripDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                />
              </div>
            ))}
            {drafts.map((draft) => (
              <div key={draft.id} className="px-4">
                <MaintenanceDraftCard
                  draft={draft}
                  boatId={boat.id}
                  components={components}
                  inventoryOptions={inventoryItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit }))}
                  onDone={() => setDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                />
              </div>
            ))}
            <MissingComponentsCard boatType={boat.type ?? null} suggestions={missingSuggestions} />
            {!hasTrips && <NoTripsCard boatId={boat.id} />}
            {!hasInventory && <NoInventoryCard />}
            <WhatsNewCard hidden={hideWhatsNew} />
            <GreetingCard boatId={boat.id} hidden={hideGreeting} />

            {/* Stat tiles — 2×2 grid */}
            <div className="px-4 grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
              {/* Maint. Overdue */}
              <Link
                href="/components?status=overdue"
                className="rounded-[18px] px-4 py-4 block active:opacity-80"
                style={{ background: overdueCount > 0 ? "#FDECEA" : "#FFFFFF", border: `1.5px solid ${overdueCount > 0 ? "#F5C2BF" : "#DBE3EA"}` }}
              >
                <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: 1, color: overdueCount > 0 ? "#E0342A" : "#0B2942", fontVariantNumeric: "tabular-nums" }}>{animOverdue}</div>
                <div className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#8FB3CC", letterSpacing: "0.08em" }}>MAINT. OVERDUE</div>
              </Link>
              {/* Due soon */}
              <Link
                href="/components?status=due_soon"
                className="rounded-[18px] px-4 py-4 block active:opacity-80"
                style={{ background: dueSoonCount > 0 ? "#FFF6DF" : "#FFFFFF", border: `1.5px solid ${dueSoonCount > 0 ? "#ECD98A" : "#DBE3EA"}` }}
              >
                <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: 1, color: dueSoonCount > 0 ? "#D9A300" : "#0B2942", fontVariantNumeric: "tabular-nums" }}>{animDueSoon}</div>
                <div className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#8FB3CC", letterSpacing: "0.08em" }}>DUE SOON</div>
              </Link>
              {/* Inventory tile */}
              {lowCriticalCount > 0 ? (
                <Link
                  href="/inventory?status=missing"
                  className="rounded-[18px] px-4 py-4 block active:opacity-80"
                  style={{ background: "#FFC730", border: "1.5px solid #E6B200" }}
                >
                  <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: 1, color: "#3D2A00", fontVariantNumeric: "tabular-nums" }}>{animInventory}</div>
                  <div className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#3D2A00", letterSpacing: "0.08em", opacity: 0.7 }}>CRITICAL LOW</div>
                </Link>
              ) : lowStockCount > 0 ? (
                <Link
                  href="/inventory?status=low"
                  className="rounded-[18px] px-4 py-4 block active:opacity-80"
                  style={{ background: "#FFF6DF", border: "1.5px solid #ECD98A" }}
                >
                  <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: 1, color: "#D9A300", fontVariantNumeric: "tabular-nums" }}>{animInventory}</div>
                  <div className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#8FB3CC", letterSpacing: "0.08em" }}>SPARES LOW</div>
                </Link>
              ) : (
                <Link
                  href="/health"
                  className="rounded-[18px] px-4 py-4 block active:opacity-80"
                  style={{ background: "#E6F6EC", border: "1.5px solid #A8DDB8" }}
                >
                  <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: 1, color: "#0E7A3D", fontVariantNumeric: "tabular-nums" }}>{animInventory}</div>
                  <div className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#8FB3CC", letterSpacing: "0.08em" }}>HEALTHY</div>
                </Link>
              )}
              {/* Engine hours */}
              <Link
                href="/trips"
                className="rounded-[18px] px-4 py-4 block active:opacity-80"
                style={{ background: "#FFFFFF", border: "1.5px solid #DBE3EA" }}
              >
                <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: 1, color: "#0B2942", fontVariantNumeric: "tabular-nums" }}>{animEngineHours}</div>
                <div className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#8FB3CC", letterSpacing: "0.08em" }}>ENGINE HRS</div>
              </Link>
            </div>

            {/* Needs attention list — V2 rows with status edges */}
            {(urgentItems.length > 0 || lowStockCount > 0) ? (
              <div className="mx-4 animate-fade-up" style={{ animationDelay: "280ms" }}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#5F7488", letterSpacing: "0.1em" }}>NEEDS ATTENTION</p>
                  <Link href="/health" className="text-xs font-bold" style={{ color: "#0B7EB8" }}>View all →</Link>
                </div>
                <div className="card overflow-hidden" style={{ padding: 0 }}>
                  {urgentItems.map((item, i) => {
                    const isOverdue = item.status === "overdue";
                    const due = formatDate(item.predicted_due_date);
                    return (
                      <Link
                        key={item.component_id}
                        href={`/components/${item.component_id}`}
                        className="flex items-center gap-3 px-4 active:opacity-70"
                        style={{
                          minHeight: 56,
                          borderLeft: `5px solid ${isOverdue ? "#E0342A" : "#D9A300"}`,
                          borderBottom: (i < urgentItems.length - 1 || lowStockCount > 0) ? "1px solid #DBE3EA" : "none",
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate" style={{ fontSize: 15, color: "#0B2942" }}>{item.component_name}</div>
                          <div className="text-xs" style={{ color: "#5F7488" }}>{item.system_name ?? "—"}</div>
                        </div>
                        <span className="badge flex-shrink-0" style={isOverdue ? { background: "#E0342A", color: "#FFF" } : { background: "#D9A300", color: "#3D2A00" }}>
                          {isOverdue ? "OVERDUE" : due ? `DUE ${due}` : "DUE SOON"}
                        </span>
                      </Link>
                    );
                  })}
                  {lowStockItems.slice(0, 4).map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/inventory/${item.id}`}
                      className="flex items-center gap-3 px-4 active:opacity-70"
                      style={{
                        minHeight: 56,
                        borderLeft: `5px solid ${item.is_critical ? "#E0342A" : "#D9A300"}`,
                        borderBottom: i < Math.min(lowStockItems.length, 4) - 1 ? "1px solid #DBE3EA" : "none",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate" style={{ fontSize: 15, color: "#0B2942" }}>{item.name}</div>
                        <div className="text-xs" style={{ color: "#5F7488" }}>
                          {item.quantity} {item.unit ?? ""} remaining{item.minimum_quantity != null ? ` · min ${item.minimum_quantity}` : ""}
                        </div>
                      </div>
                      <span className="badge flex-shrink-0" style={item.is_critical ? { background: "#E0342A", color: "#FFF" } : { background: "#D9A300", color: "#3D2A00" }}>
                        {item.is_critical ? "MISSING" : "LOW"}
                      </span>
                    </Link>
                  ))}
                  {lowStockCount > 4 && (
                    <Link href="/inventory" className="block px-4 py-3 text-xs font-bold" style={{ color: "#0B7EB8", borderTop: "1px solid #DBE3EA" }}>
                      +{lowStockCount - 4} more →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="card px-4 py-3.5 flex items-center gap-3 mx-4 animate-fade-up" style={{ animationDelay: "280ms", background: "#E6F6EC", borderColor: "#A8DDB8" }}>
                <CheckCircle size={18} className="flex-shrink-0" style={{ color: "#0E7A3D" } as React.CSSProperties} />
                <div>
                  <div className="font-bold" style={{ fontSize: 15, color: "#0B2942" }}>All clear</div>
                  <div className="text-xs" style={{ color: "#5F7488" }}>No overdue maintenance or low-stock items.</div>
                </div>
              </div>
            )}

            {/* Quick prompts — suggestion chips V2 */}
            <div className="pt-1 px-4 animate-fade-up" style={{ animationDelay: "360ms" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: "#5F7488", letterSpacing: "0.1em" }}>ASK THE ASSISTANT</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map(({ label, text }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage({ text })}
                    className="text-sm font-semibold active:opacity-70 transition-opacity"
                    style={{ background: "#FFFFFF", border: "1.5px solid #DBE3EA", borderRadius: 8, padding: "8px 16px", color: "#0B2942" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active chat: messages only */
          <div className="flex flex-col">
            {tripDrafts.map((draft) => (
              <div key={draft.id} className="px-4 pt-3">
                <EmailTripDraftCard
                  draft={draft}
                  onDone={() => setTripDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                />
              </div>
            ))}
            {drafts.map((draft) => (
              <div key={draft.id} className="px-4 pt-3">
                <MaintenanceDraftCard
                  draft={draft}
                  boatId={boat.id}
                  components={components}
                  inventoryOptions={inventoryItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit }))}
                  onDone={() => setDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                />
              </div>
            ))}
            <div className="px-4 py-3 space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} boatId={boat.id} onTripSaved={onTripSaved} />
              ))}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <NautiqSpinner size={40} />
                </div>
              )}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span className="text-sm text-red-700">
                    {error.message?.includes("RATE_LIMIT") || error.message?.includes("429")
                      ? "We've used up our daily AI limit — please try again tomorrow."
                      : "Something went wrong — please try again."}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-3 pt-3 pb-2" style={{ background: "#FFFFFF", borderTop: "1.5px solid #DBE3EA" }}>
        {/* Main input row */}
        <div className="flex items-end gap-2">
          {/* Voice button */}
          <button
            onClick={handleVoice}
            className="shrink-0 flex items-center justify-center rounded-full transition-all"
            style={{
              width: 44,
              height: 44,
              background: isRecording ? "#E0342A" : "#0B2942",
              color: "#fff",
              border: "none",
              flexShrink: 0,
            }}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? (
              <span className="h-3.5 w-3.5 rounded-sm bg-white animate-pulse" />
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
            placeholder="Ask me anything…"
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
            style={{
              minHeight: "40px",
              background: "#F4F7FA",
              border: "1.5px solid #DBE3EA",
              color: "#0B2942",
            }}
          />

          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ width: 40, height: 40, background: "#F4F7FA", border: "1.5px solid #DBE3EA", color: "#8FB3CC" }}
            aria-label="New chat"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex shrink-0 items-center justify-center rounded-full transition disabled:opacity-40"
            style={{ width: 40, height: 40, background: "#0B2942", color: "#FFFFFF" }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Hidden file inputs for scan */}
        <input
          ref={inventoryScanRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInventoryScan}
        />
        <input
          ref={inventoryScanCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInventoryScan}
        />

        {/* Scan source picker */}
        {showScanPicker && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
            onClick={() => setShowScanPicker(false)}
          >
            <div
              className="bg-white rounded-t-2xl shadow-xl pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Scan item</p>
                <button
                  onClick={() => setShowScanPicker(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-4 py-3 space-y-2 pb-6">
                <button
                  onClick={() => { setShowScanPicker(false); inventoryScanCameraRef.current?.click(); }}
                  className="flex w-full items-center gap-3 rounded-xl btn-primary px-4 py-3 text-sm font-semibold text-white"
                >
                  <Camera size={18} />
                  Take photo
                </button>
                <button
                  onClick={() => { setShowScanPicker(false); inventoryScanRef.current?.click(); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <FolderOpen size={18} />
                  Choose from device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
