"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const scrollElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // The scrollable container is the <main> element in the app layout
    const el = document.querySelector("main.flex-1") as HTMLElement | null;
    if (!el) return;
    scrollElRef.current = el;

    function onScroll() {
      setVisible((el?.scrollTop ?? 0) > 200);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    scrollElRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-md transition hover:bg-slate-50 cursor-pointer"
    >
      <ChevronUp size={14} />
      Top
    </button>
  );
}
