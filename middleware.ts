import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-mw", "bypass");
  return res;
}

export const config = {
  matcher: ["/", "/dashboard-admin/:path*", "/dashboard-seller/:path*", "/dashboard-user/:path*"],
};
