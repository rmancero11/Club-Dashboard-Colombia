import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Puedes hacer verificaciones aquí si quieres
  return NextResponse.next();
}

// Aplica el middleware solo a rutas específicas
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
