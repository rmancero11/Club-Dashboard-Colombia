import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { assignSellerAutomatically } from "@/app/lib/userService";

const allowedOrigin = "https://clubdeviajerossolteros.com";
const BUSINESS_SLUG_DEFAULT = process.env.BUSINESS_SLUG_DEFAULT ?? "clubdeviajeros";
const SELLER_DEFAULT_ID = process.env.SELLER_DEFAULT_ID || null;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET no definido");

const enc = new TextEncoder();

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "";
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "";
  try {
    if (origin !== allowedOrigin) {
      return NextResponse.json(
        { success: false, message: "Origin no permitido" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    const body = await req.json();
    const { name, email, country, whatsapp, presupuesto, preferencia, destino, password, businessSlug } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña son obligatorios" },
        { status: 200, headers: corsHeaders(origin) }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 200, headers: corsHeaders(origin) }
      );
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug ?? BUSINESS_SLUG_DEFAULT },
      select: { id: true },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        phone: whatsapp,
        country,
        budget: presupuesto,
        preference: preferencia,
        destino,
        password: hashedPassword,
        role: "USER",
        businessId: business?.id ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        status: true,
        avatar: true,
        businessId: true,
        createdAt: true,
      },
    });

    // Asignación automática de vendedor y creación/actualización del client
    let clientData = null;
    if (business?.id) {
      clientData = await assignSellerAutomatically({
        userId: newUser.id,
        businessId: business.id,
        name,
        email,
        phone: whatsapp,
        country,
        destino,
        preferencia,
        sellerDefaultId: SELLER_DEFAULT_ID,
      });
    }

    // Crear JWT para redirección
    const token = await new SignJWT({ sub: newUser.id, purpose: "onboard" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(enc.encode(JWT_SECRET));

    const redirectUrl = `https://clubsocial-phi.vercel.app/api/auth/accept-register?r=${encodeURIComponent(token)}&next=/dashboard-user`;

    return NextResponse.json(
      { success: true, usuario: newUser, clientId: clientData?.clientId, redirectUrl },
      { status: 201, headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error al registrar:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
