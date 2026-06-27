"use client";

import { Menu } from "lucide-react";

export default function ChatMenuTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("nautiq:open-chat-actions"))}
      className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 transition"
      title="Quick actions"
    >
      <Menu size={19} />
    </button>
  );
}
