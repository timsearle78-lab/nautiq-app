"use client";

import { Menu } from "lucide-react";

export default function ChatMenuTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("nautiq:open-chat-actions"))}
      className="absolute top-0 left-0 flex items-center justify-center h-14 w-14 text-slate-500 hover:bg-slate-50 transition"
      title="Quick actions"
    >
      <Menu size={20} />
    </button>
  );
}
