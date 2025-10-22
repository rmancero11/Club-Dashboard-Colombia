import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuth();

  // Verificar que sea un usuario logueado y con rol USER
  if (!auth || auth.role !== "USER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Buscar la próxima reserva del usuario
    const reservations = await prisma.reservation.findMany({
      where: {
        client: {
          userId: auth.userId, // referencia correcta al User asociado
        },
        status: { not: "CANCELED" },
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            country: true,
            imageUrl: true,
            description: true,
          },
        },
      },
      orderBy: {
        startDate: "asc", // opcional: para traer la próxima por fecha
      },
      take: 1, // solo queremos la más próxima
    });

    const nextDestination = reservations[0]?.destination ?? null;

    return NextResponse.json({ nextDestination });
  } catch (e) {
    console.error("Error al obtener reservas:", e);
    return NextResponse.json(
      { error: "No se pudieron cargar las reservas" },
      { status: 500 }
    );
  }
}
