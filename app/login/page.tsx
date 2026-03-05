"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  const signIn = async () => {
    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setStatus(`Error: ${error.message}`);
    router.push(nextPath);
    router.refresh();
  };

  const signUp = async () => {
    setStatus("Signing up...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setStatus(`Error: ${error.message}`);
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={signIn}>Sign in</button>
          <button onClick={signUp}>Sign up</button>
        </div>

        <p><b>Status:</b> {status}</p>
      </div>
    </div>
  );
}