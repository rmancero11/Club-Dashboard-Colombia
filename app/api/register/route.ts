import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://clubdeviajerossolteros.com", // 👈 tu dominio
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Manejo del preflight OPTIONS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
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
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email y contraseña son obligatorios",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "El correo ya está registrado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
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

    return new Response(JSON.stringify({ success: true, userId: user.id }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Register error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Error al registrar" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
