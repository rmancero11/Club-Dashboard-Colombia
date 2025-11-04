import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const isLocal = process.env.NODE_ENV !== "production";

res.cookies.set("token", "", {
  httpOnly: true,
  secure: !isLocal,
  sameSite: "lax",
  path: "/",
  maxAge: 0,
  ...(isLocal ? {} : { domain: "dashboard.clubdeviajerossolteros.com" }),
});
  return res;
}

export async function DELETE() { return POST(); }
