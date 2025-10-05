import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "";
const enc = new TextEncoder();
const BUSINESS_SLUG_DEFAULT = process.env.BUSINESS_SLUG_DEFAULT ?? "clubdeviajeros";

async function signToken(payload: Record<string, unknown>, exp = "1d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(enc.encode(JWT_SECRET));
}

export async function POST(req: Request) {
  try {
    const { name, email, password, whatsapp, country, commissionRate, businessSlug } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business no encontrado" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone: whatsapp ?? null,
        country: country ?? null,
        password: hashed,
        role: "SELLER",
        status: "ACTIVE",
        businessId: business.id,
        commissionRate: commissionRate != null ? Number(commissionRate) : null,
        timezone: "America/Bogota",
      },
      select: {
        id: true, name: true, email: true, role: true, businessId: true,
      },
    });

    const token = await signToken({
      id: user.id,
      role: user.role,
      businessId: user.businessId,
    });

    const res = NextResponse.json({ user });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
