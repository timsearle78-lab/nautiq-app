"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Wrench, Package, Settings } from "lucide-react";

const tabs = [
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/maintenance", icon: Wrench, label: "Maintain" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/components", icon: Settings, label: "Parts" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/chat" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                active
                  ? "text-ocean-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
