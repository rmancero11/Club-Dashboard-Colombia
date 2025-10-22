import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // expirada
  });

  return res;
}

export async function DELETE() {
  return POST();
}
