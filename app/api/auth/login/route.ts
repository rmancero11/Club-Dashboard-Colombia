import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

// Firma el token con payload + subject (sub = user.id)
async function signToken(
  payload: Record<string, unknown>,
  { expiresIn = "1d", subject }: { expiresIn?: string; subject: string }
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(subject)                 // 👈 sub = user.id
    .sign(enc.encode(JWT_SECRET));
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,   // "ADMIN" | "SELLER" | "USER"
        status: true, // "ACTIVE" | "INACTIVE"
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

    // Incluimos 'role' en el payload para que el middleware lo lea
    const token = await signToken(
      { id: user.id, role: user.role },
      { expiresIn: "1d", subject: user.id } // 👈 asegura sub
    );

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });

    return res;
  } catch (err) {
    console.error("Error en /api/auth/login:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
