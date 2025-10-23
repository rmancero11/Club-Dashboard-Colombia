import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Middleware "edge-safe" sin imports de Node
  return NextResponse.next();
}

// Evita ejecutar en assets estáticos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
