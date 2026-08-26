"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NautiqLogo from "@/components/ui/nautiq-logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus(error.message);
    } else {
      router.push("/settings?passwordReset=1");
    }
  }

  const isError = !!status;

  const inputStyle = {
    borderRadius: 11,
    border: "1.5px solid #E0E6EC",
    background: "#FFFFFF",
    padding: "13px 15px",
    fontSize: 14.5,
    color: "#0F2335",
    width: "100%",
    outline: "none",
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "#0B7EB8";
      e.target.style.boxShadow = "0 0 0 4px rgba(11,126,184,.14)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "#E0E6EC";
      e.target.style.boxShadow = "none";
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "#EEF1F5" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <NautiqLogo size={20} />
        <h2 className="mt-6 text-xl font-semibold text-slate-800">Set new password</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}>
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              {...focusHandlers}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-2 block" style={{ fontSize: 13, fontWeight: 600, color: "#0F2335" }}>
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
              {...focusHandlers}
              placeholder="Repeat your password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl btn-primary px-6 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating…" : "Update password"}
          </button>

          {status ? (
            <div
              className="px-4 py-3"
              style={{
                borderRadius: 11,
                border: `1px solid ${isError ? "#F3C4C4" : "#B8E2C8"}`,
                background: isError ? "#FDEBEB" : "#E7F6EE",
                color: isError ? "#E0342A" : "#0E7A3D",
                fontSize: 13,
              }}
            >
              {status}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
