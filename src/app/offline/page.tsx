"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect into the app — the OfflineBanner handles the offline state.
// This page is only reached when the SW has no cached version of the
// requested URL and no cached app shell either (very first visit offline).
export default function OfflinePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2942]">
      <p className="text-white/60 text-sm">Loading…</p>
    </div>
  );
}
