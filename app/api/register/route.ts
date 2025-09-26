import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

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
    const {
      name,
      email,
      country,
      whatsapp,
      presupuesto,
      preferencia,
      password,
    } = body; 


    const newUser = await prisma.user.create({
      data: {
        email,
        firstName: name,         
        phone: whatsapp,
        country,
        budget: presupuesto,
        preference: preferencia,
        password,                
      },
    });

    return new NextResponse(
      JSON.stringify({ success: true, usuario: newUser }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error al registrar:", error);

    return new NextResponse(
      JSON.stringify({ success: false, error: "Error al registrar" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
