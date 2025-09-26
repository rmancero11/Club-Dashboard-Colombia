import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

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

function cordHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://clubdeviajerossolteros.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
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
      return NextResponse.json(
        { success: false, message: "Email y Contraseña son obligatorios" },
        { status: 200, headers: cordHeaders() }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "El correo ya está registrado",
        },
        { status: 200, headers: cordHeaders() }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
      },
    });

    return new NextResponse(
      JSON.stringify({ success: true, usuario: newUser }),
      {
        status: 201,
        headers: cordHeaders(),
      }
    );
  } catch (error) {
    console.error("Error al registrar:", error);

    return new NextResponse(
      JSON.stringify({ success: false, error: "Error al registrar" }),
      {
        status: 500,
        headers: cordHeaders(),
      }
    );
  }
}
