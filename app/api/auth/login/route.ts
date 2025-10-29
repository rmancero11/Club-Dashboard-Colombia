import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enc = new TextEncoder();
const COOKIE_DOMAIN = process.env.NODE_ENV === "production"
  ? "dashboard.clubdeviajerossolteros.com"
  : undefined;

async function signToken(
  payload: Record<string, unknown>,
  { expiresIn = "1d", subject }: { expiresIn?: string; subject: string }
) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(subject)
    .sign(enc.encode(secret));
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
    if (!process.env.JWT_SECRET) {
      console.error("[LOGIN] JWT_SECRET no definido");
      return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      select: {
        id: true, name: true, email: true, password: true,
        role: true, status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cuenta inactiva" }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await signToken(
      { id: user.id, role: user.role, email: user.email },
      { expiresIn: "1d", subject: user.id }
    );

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,                 // en prod debe ser true
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,         // 1 día
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    });

    return res;
  } catch (err) {
    console.error("Error en /api/auth/login:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
