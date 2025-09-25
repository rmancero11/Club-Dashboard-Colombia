import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma";

// Configuración de CORS
const allowedOrigin = "https://clubdeviajerossolteros.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Manejo de POST
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      country,
      whatsapp,
      presupuesto,
      preferencia,
      destino,
      password,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña son obligatorios" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const [firstName, lastName] = (name || "").split(/\s+/, 2);
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: whatsapp,
        country,
        budget: presupuesto,
        preference: preferencia,
        password: hashed,
      },
    });

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201, headers: corsHeaders() }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, message: "Error al registrar" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Manejo de OPTIONS (preflight request)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders() });
}
