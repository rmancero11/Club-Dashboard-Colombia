import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic"; 
export const revalidate = 0;            
export const runtime = "nodejs";        

const JWT_SECRET = process.env.JWT_SECRET!;
const enc = new TextEncoder();
const BASE_URL = "https://dashboard.clubdeviajerossolteros.com";
const COOKIE_DOMAIN = "dashboard.clubdeviajerossolteros.com";

function sanitizeNext(nextParam: string | null) {
  if (!nextParam) return "/dashboard-user";
  try {
    new URL(nextParam); 
    return "/dashboard-user";
  } catch {}
  return nextParam.startsWith("/") ? nextParam : "/dashboard-user";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const r = url.searchParams.get("r");
    const next = sanitizeNext(url.searchParams.get("next"));

    if (!r || !JWT_SECRET) {
      const u = new URL("/login", BASE_URL);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const { payload } = await jwtVerify(r, enc.encode(JWT_SECRET), { algorithms: ["HS256"] });
    if (payload.purpose !== "onboard" || !payload.sub) {
      const u = new URL("/login", BASE_URL);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const user = await prisma.user.findUnique({
      where: { id: String(payload.sub) },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      const u = new URL("/login", BASE_URL);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const sessionJwt = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode(JWT_SECRET));

    const res = NextResponse.redirect(new URL(next, BASE_URL));
    res.cookies.set("token", sessionJwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      domain: COOKIE_DOMAIN,
    });
    return res;
  } catch (e) {
    console.error("[accept-register] error:", e);
    const u = new URL("/login", BASE_URL);
    u.searchParams.set("next", "/dashboard-user");
    return NextResponse.redirect(u);
  }
}
