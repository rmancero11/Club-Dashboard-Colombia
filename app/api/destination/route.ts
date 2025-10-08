import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const destinos = await prisma.destination.findMany({
      where: { isActive: true }, // Solo activos
      orderBy: [{ popularityScore: "desc" }, { createdAt: "desc" }],
      take: 20, // Limitamos por ejemplo
    });

    return NextResponse.json({ items: destinos });
  } catch (err: any) {
    console.error("Error al obtener destinos:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los destinos" },
      { status: 500 }
    );
  }
}