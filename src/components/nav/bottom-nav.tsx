"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, Package } from "lucide-react";
import ProfileSheet from "./profile-sheet";

function NautiqAnchorIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="50" cy="18" r="9" />
      <line x1="50" y1="27" x2="50" y2="84" />
      <line x1="26" y1="43" x2="74" y2="43" />
      <path d="M16 56 C 16 76, 32 86, 50 86 C 68 86, 84 76, 84 56" />
    </svg>
  );
}

interface Tab {
  href: string;
  label: string;
  lucide?: React.ElementType;
  custom?: "anchor";
}

const tabs: Tab[] = [
  { href: "/chat", label: "Home", lucide: Home },
  { href: "/trips", label: "Trips", custom: "anchor" },
  { href: "/maintenance", label: "Maintain", lucide: Wrench },
  { href: "/inventory", label: "Inventory", lucide: Package },
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
          {tabs.map(({ href, label, lucide: Icon, custom }) => {
            const active = pathname === href || (href !== "/chat" && pathname.startsWith(href));
            const color = active ? "#0B7EB8" : "#8593A0";
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
                style={{ color, fontSize: 11.5, fontWeight: active ? 700 : 600 }}
              >
                {custom === "anchor" ? (
                  <NautiqAnchorIcon size={22} color={color} />
                ) : Icon ? (
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                ) : null}
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
