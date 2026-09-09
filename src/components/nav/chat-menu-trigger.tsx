"use client";

import { Menu } from "lucide-react";

export default function ChatMenuTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("nautiq:open-chat-actions"))}
      className="flex items-center justify-center h-14 w-14 text-white/60 hover:text-white transition"
      title="Quick actions"
    >
      <Menu size={20} />
    </button>
  );
}
