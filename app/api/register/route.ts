export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const enc = new TextEncoder();

/**
 * DOMINIOS:
 * - WordPress (sitio público): https://clubdeviajerossolteros.com
 * - App Next.js (dashboard):  https://dashboard.clubdeviajerossolteros.com
 */

const ALLOWED_ORIGINS = new Set([
  "https://clubdeviajerossolteros.com",
  "https://www.clubdeviajerossolteros.com",
]);

function normalizeOrigin(o: string | null) {
  return o ? o.replace(/\/$/, "") : null;
}

function corsHeaders(origin: string | null) {
  const normalized = normalizeOrigin(origin);
  const allow = normalized && ALLOWED_ORIGINS.has(normalized)
    ? normalized
    : "https://clubdeviajerossolteros.com"; 
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as Record<string, string>;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || !ALLOWED_ORIGINS.has(normalizedOrigin)) {
      return NextResponse.json(
        { success: false, message: "Origin no permitido", originRecibido: normalizedOrigin ?? null },
        { status: 403, headers }
      );
    }

    const body = await req.json();
    const {
      name, email, country, whatsapp, destino, password, comentario,
      soltero, afirmacion, gustos, acepta_terminos, flujo,
    } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña son obligatorios" },
        { status: 400, headers }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 409, headers }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email, name,
        phone: whatsapp, country, destino,
        password: hashedPassword,
        role: "USER", status: "ACTIVE",
        comment: comentario ?? null,
        singleStatus: soltero ?? null,
        affirmation: afirmacion ?? null,
        preference: gustos ?? null,
        acceptedTerms: acepta_terminos === "on" || acepta_terminos === true,
        flow: flujo ?? null,
        timezone: "America/Bogota",
        verified: false,
      },
      select: {
        id: true, email: true, name: true, phone: true, country: true,
        role: true, status: true, avatar: true, createdAt: true,
      },
    });

    const SELLER_DEFAULT_ID = process.env.SELLER_DEFAULT_ID || null;
    let sellerIdToUse: string | null = SELLER_DEFAULT_ID;

    if (sellerIdToUse) {
      const ok = await prisma.user.findFirst({
        where: { id: sellerIdToUse, role: "SELLER", status: "ACTIVE" },
        select: { id: true },
      });
      if (!ok) sellerIdToUse = null;
    }

    if (!sellerIdToUse) {
      const fallback = await prisma.user.findFirst({
        where: { role: "SELLER", status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      sellerIdToUse = fallback?.id ?? null;
    }

    if (sellerIdToUse) {
      await prisma.client.create({
        data: {
          sellerId: sellerIdToUse,
          userId: newUser.id,
          name: name || email,
          email,
          phone: whatsapp ?? null,
          country: country ?? null,
          city: null,
          notes: comentario ?? null,
          tags: [],
          isArchived: false,
        },
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("[REGISTER] JWT_SECRET faltante");
      return NextResponse.json(
        { success: false, message: "Config JWT faltante" },
        { status: 500, headers }
      );
    }

    const token = await new SignJWT({ sub: newUser.id, purpose: "onboard" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(enc.encode(JWT_SECRET));

    const redirectUrl =
      `https://dashboard.clubdeviajerossolteros.com/api/auth/accept-register` +
      `?r=${encodeURIComponent(token)}&next=/dashboard-user`;

    return NextResponse.json(
      { success: true, usuario: newUser, redirectUrl },
      { status: 201, headers }
    );

  } catch (error) {
    console.error("Error al registrar:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar" },
      { status: 500, headers }
    );
  }
}
