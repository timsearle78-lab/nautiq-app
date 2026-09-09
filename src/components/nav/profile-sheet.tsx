"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { X, LogOut, Settings, HelpCircle, Sparkles, ChevronLeft, Shield, LayoutDashboard, Anchor } from "lucide-react";
import { selectBoat } from "@/app/(app)/actions";
import BoatReportButton from "@/components/reports/boat-report-button";
import { CHANGELOG } from "@/lib/changelog";

interface ProfileSheetProps {
  email: string;
  initials: string;
  isAdmin?: boolean;
  boats?: { id: string; name: string }[];
  selectedBoatId?: string;
  onClose: () => void;
}

export default function ProfileSheet({ email, initials, isAdmin, boats = [], selectedBoatId = "", onClose }: ProfileSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [switchingBoatId, setSwitchingBoatId] = useState<string | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1040px] z-50 bg-white rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]">
        {showChangelog ? (
          <>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
              <button onClick={() => setShowChangelog(false)} className="text-slate-400 hover:text-slate-600 p-1 -ml-1">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-base font-semibold text-slate-800">{"What's New"}</h2>
            </div>
            <div className="overflow-y-auto max-h-[70dvh] px-5 py-4 space-y-6">
              {CHANGELOG.map((release) => (
                <div key={release.date}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-800">{release.label}</span>
                    <span className="text-xs text-slate-400">{release.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {release.features.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <span className="text-ocean-500 mt-0.5 shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Profile</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-ocean-600 flex items-center justify-center text-white font-semibold text-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{email}</p>
                {isAdmin && (
                  <span className="inline-block mt-1 text-xs font-medium text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-full px-2 py-0.5">
                    Admin
                  </span>
                )}
              </div>
            </div>
            {/* Boat switcher */}
            {boats.length > 0 && (
              <div className="px-5 pb-4" style={{ borderBottom: "1.5px solid #DBE3EA" }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#8FB3CC", textTransform: "uppercase", marginBottom: 8 }}>My boats</p>
                <div className="space-y-1">
                  {boats.map((boat) => {
                    const isActive = boat.id === selectedBoatId;
                    const isSwitching = switchingBoatId === boat.id;
                    return (
                      <button
                        key={boat.id}
                        disabled={!!switchingBoatId}
                        onClick={async () => {
                          if (isActive) return;
                          setSwitchingBoatId(boat.id);
                          onClose();
                          const fd = new FormData();
                          fd.append("boat_id", boat.id);
                          fd.append("return_to", "/chat");
                          await selectBoat(fd);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                        style={{
                          background: isActive ? "#0B2942" : isSwitching ? "#EBF2F8" : "#F4F7FA",
                          border: `1.5px solid ${isActive ? "#0B2942" : isSwitching ? "#0B7EB8" : "#DBE3EA"}`,
                          opacity: switchingBoatId && !isSwitching ? 0.5 : 1,
                        }}
                      >
                        {isSwitching ? (
                          <span style={{
                            width: 15, height: 15, flexShrink: 0,
                            border: "2px solid #DBE3EA", borderTopColor: "#0B7EB8",
                            borderRadius: "50%", display: "inline-block",
                            animation: "spin 0.7s linear infinite",
                          }} />
                        ) : (
                          <Anchor size={15} style={{ color: isActive ? "#FFC730" : "#8FB3CC", flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#FFFFFF" : isSwitching ? "#0B7EB8" : "#0B2942" }}>
                          {isSwitching ? "Switching…" : boat.name}
                        </span>
                        {isActive && !isSwitching && (
                          <span className="ml-auto rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, background: "#FFC730", color: "#3D2A00" }}>
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="px-5 pb-6 space-y-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-ocean-200 bg-ocean-50 text-ocean-700 font-medium text-sm hover:bg-ocean-100 transition-colors"
                >
                  <LayoutDashboard size={18} className="text-ocean-500" />
                  Admin dashboard
                </Link>
              )}
              <BoatReportButton />
              <button
                onClick={() => setShowChangelog(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                <Sparkles size={18} className="text-slate-400" />
                {"What's New"}
              </button>
              <Link
                href="/help"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                <HelpCircle size={18} className="text-slate-400" />
                Help & Support
              </Link>
              <Link
                href="/legal/privacy"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                <Shield size={18} className="text-slate-400" />
                Privacy & Terms
              </Link>
              <Link
                href="/settings"
                onClick={onClose}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                <Settings size={18} className="text-slate-400" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-50"
              >
                <LogOut size={18} />
                {loading ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
