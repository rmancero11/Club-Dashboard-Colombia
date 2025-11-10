import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuth();

  if (!auth || auth.role !== "USER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Obtener el clientId asociado al usuario
    const client = await prisma.client.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ reservations: [] });
    }

    // Buscar TODAS las reservas del usuario (excepto canceladas)
    const reservations = await prisma.reservation.findMany({
  where: {
    clientId: client.id,
    status: { not: "CANCELED" },
  },
  include: {
    destination: {
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        imageUrl: true,
        description: true,
        membership: true,
        priceUSDWithAirfare: true,
        priceUSDWithoutAirfare: true,
        // 👇 Agregamos relaciones nuevas
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tripDates: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            notes: true,
            capacity: true,
          },
        },
      },
    },
    tripDate: {
      select: {
        id: true,
        startDate: true,
        endDate: true,
        notes: true,
      },
    },
    documents: {
      select: {
        id: true,
        type: true,
        url: true,
        uploadedAt: true,
      },
    },
  },
  orderBy: { startDate: "asc" },
});


    return NextResponse.json({ reservations });
  } catch (e) {
    console.error("Error al obtener reservas:", e);
    return NextResponse.json(
      { error: "No se pudieron cargar las reservas" },
      { status: 500 }
    );
  }
}
