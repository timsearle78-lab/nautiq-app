"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NautiqLogo from "@/components/ui/nautiq-logo";

export default function AcceptInvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "confirm" | "accepting" | "success" | "error" | "login">("loading");
  const [boatName, setBoatName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem("pendingInviteCode", code);
        setStatus("login");
        return;
      }

      const { data: invite, error } = await supabase
        .from("boat_invites")
        .select("id, boat_id, used_at, expires_at, boats(name)")
        .eq("code", code)
        .single();

      if (error || !invite) {
        setErrorMsg("This invite link is invalid or has expired.");
        setStatus("error");
        return;
      }

      if (invite.used_at) {
        setErrorMsg("This invite has already been used.");
        setStatus("error");
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        setErrorMsg("This invite has expired. Ask the boat owner to generate a new one.");
        setStatus("error");
        return;
      }

      const boat = invite.boats as unknown as { name: string } | null;
      setBoatName(boat?.name ?? "this boat");
      setStatus("confirm");
    }
    check();
  }, [code]);

  async function accept() {
    setStatus("accepting");
    const res = await fetch(`/api/invite/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body.error ?? "Something went wrong. Please try again.");
      setStatus("error");
      return;
    }
    setStatus("success");
    setTimeout(() => router.push("/"), 1800);
  }

  return (
    <div
      className="min-h-screen flex flex-col md:items-center md:justify-center md:px-4 md:py-10"
      style={{ background: "#EEF1F5" }}
    >
      <div className="w-full md:max-w-3xl flex flex-col md:grid md:grid-cols-2 md:rounded-3xl md:overflow-hidden md:shadow-2xl">

        {/* Navy branding panel */}
        <div
          className="flex flex-col gap-4 px-6 py-8 md:p-10 text-white md:justify-between"
          style={{
            background: "radial-gradient(120% 140% at 85% 0%, #0D4A73 0%, #0B2942 50%, #061D31 100%)",
          }}
        >
          <div>
            <NautiqLogo size={22} dark />
            <h1
              className="mt-5 leading-tight"
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF" }}
            >
              You&apos;ve been invited to co-manage a boat.
            </h1>
            <p className="mt-3 leading-6" style={{ fontSize: 14, color: "rgba(159,186,206,0.85)" }}>
              NautIQ lets co-owners share trips, maintenance logs, inventory, and health tracking — all in one place.
            </p>
          </div>
          <div
            className="hidden md:block p-4"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.05)",
              color: "rgba(159,186,206,0.7)",
              fontSize: 13,
            }}
          >
            Once you accept, the boat will appear in your NautIQ and you&apos;ll have full access to its records.
          </div>
        </div>

        {/* White action panel */}
        <div className="flex-1 px-6 py-8 md:p-10" style={{ background: "#FFFFFF" }}>
          <div className="mx-auto max-w-sm flex flex-col justify-center h-full">
            {status === "loading" && (
              <p style={{ fontSize: 14, color: "#8FB3CC" }}>Checking invite…</p>
            )}

            {status === "login" && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F2335" }}>Sign in to accept</h2>
                <p className="mt-2" style={{ fontSize: 14, color: "#8FB3CC" }}>
                  You need a NautIQ account to join this boat.
                </p>
                <div className="mt-6 space-y-3">
                  <a
                    href={`/login?next=/invite/${code}`}
                    className="btn-primary block w-full py-3 rounded-xl text-sm font-semibold text-center"
                  >
                    Sign in
                  </a>
                  <a
                    href={`/signup?next=/invite/${code}`}
                    className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
                    style={{
                      border: "1.5px solid #DBE3EA",
                      color: "#0B2942",
                    }}
                  >
                    Create a free account
                  </a>
                </div>
              </>
            )}

            {(status === "confirm" || status === "accepting") && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F2335" }}>Join {boatName}</h2>
                <p className="mt-2" style={{ fontSize: 14, color: "#8FB3CC" }}>
                  Accept the invitation to add <strong style={{ color: "#0F2335" }}>{boatName}</strong> to your NautIQ. You&apos;ll have full access to its logs, maintenance records, and inventory.
                </p>
                <button
                  onClick={accept}
                  disabled={status === "accepting"}
                  className="btn-primary mt-6 w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {status === "accepting" ? "Joining…" : "Accept invitation"}
                </button>
              </>
            )}

            {status === "success" && (
              <>
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-full mb-4"
                  style={{ background: "#ECFDF5" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10l4.5 4.5L16 6" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F2335" }}>You&apos;re in!</h2>
                <p className="mt-2" style={{ fontSize: 14, color: "#8FB3CC" }}>
                  <strong style={{ color: "#0F2335" }}>{boatName}</strong> has been added to your account. Redirecting you now…
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-full mb-4"
                  style={{ background: "#FEF2F2" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6l8 8M14 6l-8 8" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F2335" }}>Invite invalid</h2>
                <p className="mt-2" style={{ fontSize: 14, color: "#8FB3CC" }}>{errorMsg}</p>
                <a
                  href="/"
                  className="mt-6 block text-sm font-medium"
                  style={{ color: "#0B7EB8" }}
                >
                  Back to NautIQ
                </a>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
