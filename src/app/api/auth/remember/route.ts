import { NextResponse, type NextRequest } from "next/server";

// Called right after login to set or clear the nautiq_remember cookie.
// This cookie is read by middleware to decide whether auth cookies should
// be persistent (with maxAge) or session-only (no maxAge).
export async function POST(req: NextRequest) {
  const { persist } = await req.json();
  const res = NextResponse.json({ ok: true });

  if (persist) {
    res.cookies.set("nautiq_remember", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  } else {
    // Delete the remember cookie — auth cookies will become session-only
    // the next time middleware refreshes the session
    res.cookies.delete("nautiq_remember");
  }

  return res;
}
