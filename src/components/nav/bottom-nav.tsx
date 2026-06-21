"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, Package, Anchor } from "lucide-react";
import ProfileSheet from "./profile-sheet";

const tabs = [
  { href: "/chat", icon: Home, label: "Home" },
  { href: "/trips", icon: Anchor, label: "Trips" },
  { href: "/maintenance", icon: Wrench, label: "Maintain" },
  { href: "/inventory", icon: Package, label: "Inventory" },
];

interface BottomNavProps {
  userEmail: string;
  userInitials: string;
}

export default function BottomNav({ userEmail, userInitials }: BottomNavProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E6EBF0",
          boxShadow: "0 -2px 18px rgba(13,52,87,.05)",
        }}
      >
        <div className="flex h-16">
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/chat" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
                style={{
                  color: active ? "#0B7EB8" : "#8593A0",
                  fontSize: 11.5,
                  fontWeight: active ? 700 : 600,
                }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                <span>{label}</span>
                {active && (
                  <span
                    className="absolute bottom-1 h-1 w-1 rounded-full"
                    style={{ background: "#0B7EB8" }}
                  />
                )}
              </Link>
            );
          })}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
            style={{ color: "#8593A0", fontSize: 11.5, fontWeight: 600 }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold leading-none"
              style={{ background: "linear-gradient(135deg, #15A0D6, #0B7EB8)" }}
            >
              {userInitials}
            </div>
            <span>Profile</span>
          </button>
        </div>
      </nav>
      {profileOpen && (
        <ProfileSheet
          email={userEmail}
          initials={userInitials}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
