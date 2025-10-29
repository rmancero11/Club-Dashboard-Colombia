import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma"; // asegúrate que este path coincide con tu setup

// GET /api/users?destino=Paris&excludeUserId=abc123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const destino = searchParams.get("destino");
    const excludeUserId = searchParams.get("excludeUserId");

    // Si hay parámetro de destino, filtramos usuarios que tengan ese destino en su array
    const users = await prisma.user.findMany({
      where: {
        AND: [
          destino ? { destino: { has: destino } } : {},
          excludeUserId ? { id: { not: excludeUserId } } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        country: true,
        destino: true,
        preference: true,
        role: true,
        status: true,
        verified: true,
        phone: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
