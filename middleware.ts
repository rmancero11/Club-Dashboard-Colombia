// middleware.ts (temporal de diagnóstico)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const hasToken = !!req.cookies.get("token")?.value;
    const url = req.nextUrl.clone();
    url.pathname = hasToken ? "/dashboard-user" : "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"], // SOLO raíz mientras diagnosticamos
};
