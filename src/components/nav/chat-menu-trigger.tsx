"use client";

import { Menu } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function ChatMenuTrigger() {
  const isOnline = useOnlineStatus();

  return (
    <button
      onClick={() => isOnline && window.dispatchEvent(new CustomEvent("nautiq:open-chat-actions"))}
      disabled={!isOnline}
      className="flex items-center justify-center h-14 w-14 transition disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: isOnline ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}
      title={isOnline ? "Quick actions" : "Quick actions unavailable offline"}
    >
      <Menu size={20} />
    </button>
  );
}
