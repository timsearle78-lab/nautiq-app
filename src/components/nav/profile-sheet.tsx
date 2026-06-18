"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { X, LogOut, Settings } from "lucide-react";

interface ProfileSheetProps {
  email: string;
  initials: string;
  onClose: () => void;
}

export default function ProfileSheet({ email, initials, onClose }: ProfileSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]">
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
          </div>
        </div>
        <div className="px-5 pb-6 space-y-3">
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
      </div>
    </>
  );
}
