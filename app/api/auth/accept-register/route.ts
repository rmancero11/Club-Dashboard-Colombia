import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const enc = new TextEncoder();

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  "https://dashboard.clubdeviajerossolteros.com";

function sanitizeNext(nextParam: string | null): string {
  if (!nextParam) return "/dashboard-user";
  try {
    const asUrl = new URL(nextParam);
    return "/dashboard-user";
  } catch {
    return nextParam.startsWith("/") ? nextParam : "/dashboard-user";
  }
}

function resolveCookieDomainFromReq(req: Request) {
  if (process.env.NODE_ENV !== "production") return undefined;
  try {
    const { host } = new URL(req.url);
    if (host.endsWith(".clubdeviajerossolteros.com")) return host;
    if (host === "clubdeviajerossolteros.com") return "dashboard.clubdeviajerossolteros.com";
    return "dashboard.clubdeviajerossolteros.com";
  } catch {
    return "dashboard.clubdeviajerossolteros.com";
  }
}

function getCookieOptions(req: Request) {
  const domain = resolveCookieDomainFromReq(req);
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    ...(domain ? { domain } : {}),
  };
}

export async function GET(req: Request) {
  try {
    const incomingUrl = new URL(req.url);
    const r = incomingUrl.searchParams.get("r");
    const nextRaw = incomingUrl.searchParams.get("next");
    const next = sanitizeNext(nextRaw);

    if (!r) {
      const u = new URL("/login", BASE_URL);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const { payload } = await jwtVerify(r, enc.encode(JWT_SECRET), {
      algorithms: ["HS256"],
    });

    if (payload.purpose !== "onboard" || !payload.sub) {
      const u = new URL("/login", BASE_URL);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const userId = String(payload.sub);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      const u = new URL("/login", BASE_URL);
      u.searchParams.set("next", next);
      return NextResponse.redirect(u);
    }

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode(JWT_SECRET));

    const redirectTo = new URL(next, BASE_URL);
    const res = NextResponse.redirect(redirectTo);
    res.cookies.set("token", token, getCookieOptions(req));
    return res;
  } catch {
    const u = new URL("/login", BASE_URL);
    u.searchParams.set("next", "/dashboard-user");
    return NextResponse.redirect(u);
  }
}
