import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const enc = new TextEncoder();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const r = url.searchParams.get("r");
    const next = url.searchParams.get("next") || "/dashboard-user";

    if (!r) {
      const u = new URL("/login", url.origin);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const { payload } = await jwtVerify(r, enc.encode(JWT_SECRET));
    if (payload.purpose !== "onboard" || !payload.sub) {
      const u = new URL("/login", url.origin);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const userId = String(payload.sub);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      const u = new URL("/login", url.origin);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role, // enum Role
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode(JWT_SECRET));

    const res = NextResponse.redirect(new URL(next, url.origin));
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      ...(process.env.VERCEL ? { domain: "app.clubdeviajerossolteros.com" } : {}),
    });
    return res;
  } catch {
    const u = new URL("/login", new URL(req.url).origin);
    u.searchParams.set("next", "/dashboard-user");
    return NextResponse.redirect(u);
  }
}
