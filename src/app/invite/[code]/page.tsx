"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        // Store code in sessionStorage so we can resume after login
        sessionStorage.setItem("pendingInviteCode", code);
        setStatus("login");
        return;
      }

      // Look up the invite
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
      setErrorMsg(body.error ?? "Something went wrong.");
      setStatus("error");
      return;
    }
    setStatus("success");
    setTimeout(() => router.push("/"), 1500);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
        <p className="text-slate-500 text-sm">Checking invite…</p>
      </div>
    );
  }

  if (status === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-3xl">⚓</div>
          <h1 className="text-lg font-bold text-slate-900">You&apos;ve been invited to a boat</h1>
          <p className="text-sm text-slate-500">Sign in or create an account to accept the invitation.</p>
          <a
            href={`/login?next=/invite/${code}`}
            className="btn-primary block w-full py-2 rounded-xl text-sm font-semibold text-center"
          >
            Sign in to accept
          </a>
          <a
            href={`/signup?next=/invite/${code}`}
            className="block text-sm text-[#0B7EB8] font-medium"
          >
            Create a free account
          </a>
        </div>
      </div>
    );
  }

  if (status === "confirm" || status === "accepting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-3xl">⚓</div>
          <h1 className="text-lg font-bold text-slate-900">Join {boatName}</h1>
          <p className="text-sm text-slate-500">
            You&apos;ve been invited to co-manage <strong>{boatName}</strong> on NautIQ. You&apos;ll have full access to its logs, maintenance, and inventory.
          </p>
          <button
            onClick={accept}
            disabled={status === "accepting"}
            className="btn-primary w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {status === "accepting" ? "Joining…" : "Accept invitation"}
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-3xl">✅</div>
          <h1 className="text-lg font-bold text-slate-900">You&apos;re in!</h1>
          <p className="text-sm text-slate-500">{boatName} has been added to your account. Redirecting…</p>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-3xl">🚫</div>
        <h1 className="text-lg font-bold text-slate-900">Invalid invite</h1>
        <p className="text-sm text-slate-500">{errorMsg}</p>
        <a href="/" className="block text-sm text-[#0B7EB8] font-medium">Back to NautIQ</a>
      </div>
    </div>
  );
}
