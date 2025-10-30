export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { pickSellerWeighted } from "@/app/lib/assignSeller";

const enc = new TextEncoder();

// Orígenes permitidos (WP)
const WP_ALLOWED = new Set([
  "https://clubdeviajerossolteros.com",
  "https://www.clubdeviajerossolteros.com",
]);

const BASE_DASHBOARD = "https://dashboard.clubdeviajerossolteros.com";

function normalizeOrigin(o: string | null) {
  return o ? o.replace(/\/$/, "") : null;
}

function corsHeaders(origin: string | null) {
  const o = normalizeOrigin(origin);
  const allow = o && WP_ALLOWED.has(o) ? o : "https://clubdeviajerossolteros.com";
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
    const normalized = normalizeOrigin(origin);
    if (!normalized || !WP_ALLOWED.has(normalized)) {
      return NextResponse.json(
        { success: false, message: "Origin no permitido", originRecibido: normalized ?? null },
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

    const emailNorm = String(email).toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 409, headers }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const toArray = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

    const { newUser, clientId } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: emailNorm,
          name,
          phone: whatsapp,
          country,
          password: hashedPassword,
          role: "USER",
          status: "ACTIVE",
          comment: comentario ?? null,
          singleStatus: soltero ?? null,
          affirmation: afirmacion ?? null,
           destino: toArray(destino),
          preference: toArray(gustos),
          acceptedTerms: acepta_terminos === "on" || acepta_terminos === true || acepta_terminos === "true",
          flow: flujo ?? null,
          timezone: "America/Bogota",
          verified: false,
        },
        select: { id: true, email: true, name: true },
      });

      const sellerId = await pickSellerWeighted(tx); 
      const createdClient = await tx.client.create({
        data: {
          userId: createdUser.id,
          sellerId: sellerId ?? null,  
          name: name || emailNorm,
          email: createdUser.email,
          phone: whatsapp ?? null,
          country: country ?? null,
          city: null,
          notes: comentario ?? null,
          tags: [],
          isArchived: false,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          action: "LEAD_ASSIGNED",
          message: "Client creado y asignado automáticamente",
          userId: createdUser.id,
          clientId: createdClient.id,
          metadata: { sellerId: sellerId ?? null, flujo: flujo ?? null, destino: destino ?? null, auto: true },
        },
      });

      return { newUser: createdUser, clientId: createdClient.id };
    });

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("[REGISTER] JWT_SECRET faltante");
      return NextResponse.json(
        { success: false, message: "Config JWT faltante" },
        { status: 500, headers }
      );
    }

    const onboardToken = await new SignJWT({ sub: newUser.id, purpose: "onboard" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(enc.encode(JWT_SECRET));

    const redirectUrl =
      `${BASE_DASHBOARD}/api/auth/accept-register` +
      `?r=${encodeURIComponent(onboardToken)}&next=/dashboard-user`;

    return NextResponse.json(
      { success: true, usuario: newUser, clientId, redirectUrl },
      { status: 201, headers }
    );
  } catch (err) {
    console.error("Error en /api/register:", err);
    return NextResponse.json(
      { success: false, error: "Error al registrar" },
      { status: 500, headers }
    );
  }
}

export {};
