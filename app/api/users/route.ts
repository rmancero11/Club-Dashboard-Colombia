import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const destino = searchParams.get("destino");
    const excludeUserId = searchParams.get("excludeUserId");

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
        avatar: true,
        country: true,
        destino: true,
        preference: true,
        role: true,
        status: true,
        verified: true,
        phone: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("❌ Error en /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
