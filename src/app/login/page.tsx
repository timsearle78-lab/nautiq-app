import { Suspense } from "react";
import { cookies } from "next/headers";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const confirmed = cookieStore.get("__nautiq_email_confirmed")?.value === "1";
  if (confirmed) cookieStore.delete("__nautiq_email_confirmed");

  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <LoginForm emailConfirmed={confirmed} />
    </Suspense>
  );
}