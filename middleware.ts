import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

type Role = "ADMIN" | "SELLER" | "USER";
interface TokenPayload extends JWTPayload { role?: Role }

const enc = new TextEncoder();

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

function redirectToLogin(req: NextRequest, clearCookie = false) {
  const url = absoluteUrl(req, "/login");
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.redirect(url);
  if (clearCookie) {
    res.cookies.set({
      name: "token",
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
  res.headers.set("x-mw", "redir-login");
  return res;
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    const publicPrefixes = [
      "/_next",              
      "/static",             
      "/assets",             
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/favicons",          
      "/api/public",
      "/api/auth",
      "/login",
      "/unauthorized",
    ];
    if (publicPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    if (pathname === "/") {
      const hasToken = Boolean(req.cookies.get("token")?.value);
      const to = hasToken ? "/dashboard-user" : "/login";
      const url = absoluteUrl(req, to);
      const res = NextResponse.redirect(url);
      res.headers.set("x-mw", "root-redirect");
      return res;
    }

    const isAdmin  = pathname.startsWith("/dashboard-admin");
    const isSeller = pathname.startsWith("/dashboard-seller");
    const isUser   = pathname.startsWith("/dashboard-user");

    if (!(isAdmin || isSeller || isUser)) {
      return NextResponse.next();
    }

    const token = req.cookies.get("token")?.value;
    if (!token) return redirectToLogin(req);

    const payload = await verifyToken(token);
    if (!payload) return redirectToLogin(req, true);

    const role = payload.role;
    const rules: { test: (p: string) => boolean; allowed: Role[] }[] = [
      { test: (p) => p.startsWith("/dashboard-admin"),  allowed: ["ADMIN"] },
      { test: (p) => p.startsWith("/dashboard-seller"), allowed: ["SELLER", "ADMIN"] },
      { test: (p) => p.startsWith("/dashboard-user"),   allowed: ["USER", "SELLER", "ADMIN"] }, // opcional: permite superiores
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
    "/dashboard-admin/:path*", 
    "/dashboard-seller/:path*", 
    "/dashboard-user/:path*",
  ],
};
