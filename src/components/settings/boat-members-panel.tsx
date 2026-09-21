"use client";

import { useState } from "react";

type Member = { id: string; user_id: string; email: string; joined_at: string };

interface Props {
  boatId: string;
  boatName: string;
  isOwner: boolean;
}

export function BoatMembersPanel({ boatId, boatName, isOwner }: Props) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadMembers() {
    setLoading(true);
    const res = await fetch(`/api/boats/${boatId}/members`);
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }

  function toggle() {
    if (!open) loadMembers();
    setOpen((v) => !v);
  }

  async function generateInvite() {
    setGenerating(true);
    const res = await fetch(`/api/boats/${boatId}/invite`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setInviteCode(data.code);
      setInviteExpiry(data.expires_at);
    }
    setGenerating(false);
  }

  async function removeMember(memberId: string) {
    await fetch(`/api/boats/${boatId}/members?memberId=${memberId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function revokeInvite() {
    await fetch(`/api/boats/${boatId}/invite`, { method: "DELETE" });
    setInviteCode(null);
    setInviteExpiry(null);
  }

  function copyLink() {
    if (!inviteCode) return;
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inviteUrl = inviteCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}` : null;
  const expiryLabel = inviteExpiry ? new Date(inviteExpiry).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="border-t border-slate-100 pt-4">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-700">Co-owners</p>
          <p className="text-xs text-slate-400 mt-0.5">Share access to this boat with others</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Member list */}
          {loading ? (
            <p className="text-xs text-slate-400">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-slate-400">No co-owners yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{m.email}</p>
                    <p className="text-xs text-slate-400">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Invite link section */}
          {isOwner && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-2">
              {inviteCode ? (
                <>
                  <p className="text-xs font-semibold text-blue-800">Invite link</p>
                  <p className="text-xs text-blue-600 break-all font-mono">{inviteUrl}</p>
                  <p className="text-xs text-blue-400">Expires {expiryLabel}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={copyLink}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                    <button
                      onClick={revokeInvite}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-blue-700">Generate a link to share with a co-owner. It expires after 7 days and can only be used once.</p>
                  <button
                    onClick={generateInvite}
                    disabled={generating}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generating ? "Generating…" : `Generate invite link for ${boatName}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
