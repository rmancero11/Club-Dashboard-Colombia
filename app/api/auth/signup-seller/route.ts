import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth"; // ← usa tu helper

const JWT_SECRET = process.env.JWT_SECRET || "";
const enc = new TextEncoder();

async function signToken(payload: Record<string, unknown>, exp = "1d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(enc.encode(JWT_SECRET));
}

function digitsOnly(raw?: string | null) {
  return (raw || "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    // ¿Quién está creando? (ADMIN o público)
    const auth = await getAuth(); // debe leer de cookies de la request
    const isAdminCreator = !!auth && auth.role === "ADMIN";

    const { name, email, password, whatsapp, country, commissionRate } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }

    let commissionToPersist: string | null = null;
    if (commissionRate !== undefined && commissionRate !== null && `${commissionRate}`.trim() !== "") {
      const n = Number(commissionRate);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: "commissionRate inválido" }, { status: 400 });
      }
      commissionToPersist = n.toFixed(2);
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        role: "SELLER",
        status: "ACTIVE",
        phone: digitsOnly(whatsapp) || null,
        whatsappNumber: digitsOnly(whatsapp) || null,
        country: country ?? null,
        commissionRate: commissionToPersist,
        timezone: "America/Bogota",
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    // Si lo crea un ADMIN, NO tocar la cookie (mantener su sesión admin)
    if (isAdminCreator) {
      return NextResponse.json({ user, createdBy: "ADMIN" }, { status: 201 });
    }

    // Auto-registro (público): sí iniciar sesión como el nuevo SELLER
    const token = await signToken({ id: user.id, role: user.role });
    const res = NextResponse.json({ user, createdBy: "SELF" }, { status: 201 });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
