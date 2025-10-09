import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const destinos = await prisma.destination.findMany({
      where: { isActive: true },
      orderBy: [{ popularityScore: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: {
        reservations: {
          where: {
            status: {
              in: ["CONFIRMED", "TRAVELING"],
            },
          },
          select: {
            client: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Mapear destinos agregando campo "travelers"
    const items = destinos.map((dest) => ({
      ...dest,
      travelers: dest.reservations
        .map((r) => r.client?.user)
        .filter(Boolean), // eliminar nulos
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Error al obtener destinos:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los destinos" },
      { status: 500 }
    );
  }
}
