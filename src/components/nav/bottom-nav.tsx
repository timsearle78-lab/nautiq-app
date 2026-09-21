"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Wrench } from "lucide-react";
import ProfileSheet from "./profile-sheet";
import NautiqAnchorIcon from "@/components/ui/nautiq-anchor-icon";
import { Package } from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

function AnchorIcon({ active }: { active: boolean }) {
  const color = active ? "var(--color-amber-400)" : "var(--color-navy-mute)";
  return <NautiqAnchorIcon size={22} color={color} />;
}

interface BottomNavProps {
  userEmail: string;
  userInitials: string;
  isAdmin?: boolean;
  boats?: { id: string; name: string }[];
  selectedBoatId?: string;
}

export default function BottomNav({ userEmail, userInitials, isAdmin, boats = [], selectedBoatId = "" }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const tabs = [
    {
      href: "/chat",
      label: "HOME",
      renderIcon: (active: boolean) => <Home size={22} strokeWidth={active ? 2.5 : 1.75} color={active ? "var(--color-amber-400)" : "var(--color-navy-mute)"} />,
    },
    {
      href: "/trips",
      label: "TRIPS",
      renderIcon: (active: boolean) => <AnchorIcon active={active} />,
    },
    {
      href: "/maintenance",
      label: "MAINTAIN",
      renderIcon: (active: boolean) => <Wrench size={22} strokeWidth={active ? 2.5 : 1.75} color={active ? "var(--color-amber-400)" : "var(--color-navy-mute)"} />,
    },
    {
      href: "/inventory",
      label: "INVENTORY",
      renderIcon: (active: boolean) => <Package size={22} strokeWidth={active ? 2.5 : 1.75} color={active ? "var(--color-amber-400)" : "var(--color-navy-mute)"} />,
    },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        style={{ background: "var(--color-navy-700)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex mx-auto w-full max-w-[1040px]" style={{ height: 60 }}>
          {tabs.map(({ href, label, renderIcon }) => {
            const active = pathname === href || (href !== "/chat" && pathname.startsWith(href));
            const isHome = href === "/chat";
            const sharedContent = (
              <>
                {renderIcon(active)}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: active ? "var(--color-amber-400)" : "var(--color-navy-mute)",
                    lineHeight: 1,
                  }}
                >
                  {label}
                </span>
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: 28, height: 2.5, background: "var(--color-amber-400)" }}
                  />
                )}
              </>
            );
            if (isHome) {
              return (
                <button
                  key={href}
                  onClick={() => {
                    if (pathname === "/chat") {
                      window.dispatchEvent(new CustomEvent("nautiq:reset-chat"));
                    } else {
                      router.push("/chat");
                    }
                  }}
                  className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-opacity active:opacity-70"
                >
                  {sharedContent}
                </button>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-opacity active:opacity-70"
              >
                {sharedContent}
              </Link>
            );
          })}
          {/* Profile avatar tab */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 transition-opacity active:opacity-70"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold leading-none"
              style={{ background: "var(--color-amber-400)", color: "var(--color-amber-ink)" }}
            >
              {userInitials}
            </div>
          </button>
        </div>
      </nav>
      {profileOpen && (
        <ProfileSheet
          email={userEmail}
          initials={userInitials}
          isAdmin={isAdmin}
          boats={boats}
          selectedBoatId={selectedBoatId}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
