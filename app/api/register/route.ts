import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/app/lib/prisma"; // 👈 asegúrate que existe lib/prisma.ts

const allowedOrigin = "https://clubdeviajerossolteros.com";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, country, whatsapp, presupuesto, preferencia, destino, password } = body;

    if (!email || !password) {
      return new NextResponse(JSON.stringify({ success: false, message: "Email y contraseña son obligatorios" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
      });
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new NextResponse(JSON.stringify({ success: false, message: "El correo ya está registrado" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
      });
    }

    // Procesar nombre
    const [firstName, lastName] = (name || "").split(/\s+/, 2);

    // Hashear contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario en Neon
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

    return new NextResponse(JSON.stringify({ success: true, userId: user.id }), {
      status: 201,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
    });
  } catch (err) {
    console.error("Register error:", err);
    return new NextResponse(JSON.stringify({ success: false, message: "Error al registrar" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
    });
  }
}




