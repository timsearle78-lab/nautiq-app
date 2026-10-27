import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("__nautiq_email_confirmed", "1", {
    httpOnly: true,
    path: "/login",
    maxAge: 300,
    sameSite: "lax",
  });
  return response;
}
