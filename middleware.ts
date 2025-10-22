import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

type Role = "ADMIN" | "SELLER" | "USER";
interface TokenPayload extends JWTPayload { role?: Role }

const enc = new TextEncoder();

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;           // <-- léelo aquí
    if (!secret) return null;                        // <-- sin secret => no válido
    const { payload } = await jwtVerify(token, enc.encode(secret));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

function redirectToLogin(req: NextRequest, clearCookie = false) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.redirect(url);
  if (clearCookie) res.cookies.set("token", "", { path: "/", maxAge: 0 });
  return res;
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // Redirige la raíz
    if (pathname === "/") {
      const hasToken = !!req.cookies.get("token")?.value;
      const url = req.nextUrl.clone();
      url.pathname = hasToken ? "/dashboard-user" : "/login";
      return NextResponse.redirect(url);
    }

    const publicPrefixes = [
      "/login",
      "/unauthorized",
      "/api/public",
      "/api/auth",
      "/favicons",
      "/_next",
      "/robots.txt",
      "/sitemap.xml",
    ];
    if (publicPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const isAdmin  = pathname.startsWith("/dashboard-admin");
    const isSeller = pathname.startsWith("/dashboard-seller");
    const isUser   = pathname.startsWith("/dashboard-user");

    if (!(isAdmin || isSeller || isUser)) return NextResponse.next();

    const token = req.cookies.get("token")?.value;
    if (!token) return redirectToLogin(req);

    const payload = await verifyToken(token);
    if (!payload) return redirectToLogin(req, true);

    const role = payload.role;
    const rules: { test: (p: string) => boolean; allowed: Role[] }[] = [
      { test: (p) => p.startsWith("/dashboard-admin"),  allowed: ["ADMIN"] },
      { test: (p) => p.startsWith("/dashboard-seller"), allowed: ["SELLER", "ADMIN"] },
      { test: (p) => p.startsWith("/dashboard-user"),   allowed: ["USER"] },
    ];

    const rule = rules.find((r) => r.test(pathname));
    if (!rule) return NextResponse.next();

    if (!role || !rule.allowed.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    // Cualquier excepción en Edge => manda al login (evita 500)
    return redirectToLogin(req, true);
  }
}

export const config = {
  matcher: ["/", "/dashboard-admin/:path*", "/dashboard-seller/:path*", "/dashboard-user/:path*"],
};
