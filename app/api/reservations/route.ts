import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuth();

  if (!auth || auth.role !== "USER" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Buscar la próxima reserva del usuario
    const reservations = await prisma.reservation.findMany({
  where: {
    client: {
      userId: auth.userId, // 🔑 aquí referenciamos al user
    },
    businessId: auth.businessId,
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
});


  const nextDestination = reservations[0]?.destination ?? null;
return NextResponse.json({ nextDestination });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudieron cargar las reservas" },
      { status: 500 }
    );
  }
}
