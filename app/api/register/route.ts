import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma";

// Función para añadir headers CORS
function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "https://clubdeviajerossolteros.com", // 👈 tu dominio
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Manejo del preflight OPTIONS
export async function OPTIONS() {
  return corsResponse({}, 200);
}

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
      return corsResponse(
        { success: false, message: "Email y contraseña son obligatorios" },
        400
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return corsResponse(
        { success: false, message: "El correo ya está registrado" },
        400
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

    return corsResponse({ success: true, userId: user.id }, 201);
  } catch (err) {
    console.error("Register error:", err);
    return corsResponse(
      { success: false, message: "Error al registrar" },
      500
    );
  }
}
