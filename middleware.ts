import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

type Role = "ADMIN" | "SELLER" | "USER";
interface TokenPayload extends JWTPayload { role?: Role }

const enc = new TextEncoder();
const DASHBOARD_DOMAIN =
  process.env.NODE_ENV === "production"
    ? "dashboard.clubdeviajerossolteros.com"
    : undefined; // en dev no fijamos domain

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(token, enc.encode(secret), {
      algorithms: ["HS256"],
    });
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

function absoluteUrl(req: NextRequest, path: string) {
  return new URL(path, req.url);
}

function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: "token",
    value: "",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    ...(DASHBOARD_DOMAIN ? { domain: DASHBOARD_DOMAIN } : {}),
  });
}

function redirectToLogin(req: NextRequest, clearCookie = false) {
  const url = absoluteUrl(req, "/login");
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.redirect(url);
  if (clearCookie) clearSessionCookie(res);
  res.headers.set("x-mw", "redir-login");
  return res;
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // Rutas públicas o estáticos
    const publicPrefixes = [
      "/_next",
      "/static",
      "/assets",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/favicons",
      "/api/public",
      "/api/auth",      // <- accept-register vive aquí
      "/unauthorized",
    ];
    if (publicPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // APIs privadas: si quieres proteger /api/*, hazlo por handler; aquí se deja pasar
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    const token = req.cookies.get("token")?.value;

    // Raíz: redirige según sesión
    if (pathname === "/") {
      const to = token ? "/dashboard-user" : "/login";
      const res = NextResponse.redirect(absoluteUrl(req, to));
      res.headers.set("x-mw", "root-redirect");
      return res;
    }

    // Si ya tiene sesión y va a /login, llévalo al dashboard
    if (pathname === "/login" && token) {
      const payload = await verifyToken(token);
      if (payload) {
        const res = NextResponse.redirect(absoluteUrl(req, "/dashboard-user"));
        res.headers.set("x-mw", "login-bounce");
        return res;
      }
    }

    // Zonas protegidas por rol
    const isAdmin  = pathname.startsWith("/dashboard-admin");
    const isSeller = pathname.startsWith("/dashboard-seller");
    const isUser   = pathname.startsWith("/dashboard-user");

    if (!(isAdmin || isSeller || isUser)) {
      return NextResponse.next();
    }

    if (!token) return redirectToLogin(req);

    const payload = await verifyToken(token);
    if (!payload) return redirectToLogin(req, true);

    const role = payload.role;
    const rules: { test: (p: string) => boolean; allowed: Role[] }[] = [
      { test: (p) => p.startsWith("/dashboard-admin"),  allowed: ["ADMIN"] },
      { test: (p) => p.startsWith("/dashboard-seller"), allowed: ["SELLER", "ADMIN"] },
      { test: (p) => p.startsWith("/dashboard-user"),   allowed: ["USER", "SELLER", "ADMIN"] },
    ];

    const rule = rules.find((r) => r.test(pathname));
    if (!rule) return NextResponse.next();

    if (!role || !rule.allowed.includes(role)) {
      const url = absoluteUrl(req, "/unauthorized");
      const res = NextResponse.redirect(url);
      res.headers.set("x-mw", "unauth-role");
      return res;
    }

    const res = NextResponse.next();
    res.headers.set("x-mw", "ok");
    return res;
  } catch {
    return redirectToLogin(req, true);
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard-admin/:path*",
    "/dashboard-seller/:path*",
    "/dashboard-user/:path*",
  ],
};
