import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Función para calcular precio con descuento
const calcDiscountedPrice = (price?: number | null, discount?: number | null) => {
  if (price == null) return null;
  if (discount == null) return price;
  return Number((price - (price * discount) / 100).toFixed(2));
};

export async function GET() {
  try {
    const destinos = await prisma.destination.findMany({
  where: { isActive: true },
  orderBy: [{ popularityScore: "desc" }, { createdAt: "desc" }],
  take: 100,
  include: {
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
    reservations: {
      where: { status: { in: ["CONFIRMED", "TRAVELING"] } },
      include: {
        client: {
          include: { user: true },
        },
      },
    },
  },
});


    // Formateo para el front
    const items = destinos.map(dest => ({
      id: dest.id,
      name: dest.name,
      country: dest.country,
      city: dest.city,
      description: dest.description,
      imageUrl: dest.imageUrl,
      categories: dest.categories.map(c => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
})),
      // precios con descuento
      listUSDWithAirfare: Number(dest.priceUSDWithAirfare),
      discountUSDWithAirfarePercent: Number(dest.discountUSDWithAirfarePercent),
      listUSDWithoutAirfare: Number(dest.priceUSDWithoutAirfare),
      discountUSDWithoutAirfarePercent: Number(dest.discountUSDWithoutAirfarePercent),
      listCOPWithAirfare: Number(dest.priceCOPWithAirfare),
      discountCOPWithAirfarePercent: Number(dest.discountCOPWithAirfarePercent),
      listCOPWithoutAirfare: Number(dest.priceCOPWithoutAirfare),
      discountCOPWithoutAirfarePercent: Number(dest.discountCOPWithoutAirfarePercent),
      price: Number(dest.price) || 0,
      discountPrice: Number(dest.discountPrice) || null,

      // Fechas de viaje
      tripDates: dest.tripDates.map(td => ({
        id: td.id,
        startDate: td.startDate,
        endDate: td.endDate,
        notes: td.notes,
        capacity: td.capacity,
      })),

      // Viajeros (clientes asociados a reservas confirmadas o en viaje)
      travelers: dest.reservations
        .map(r => r.client?.user)
        .filter(u => u !== null),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudieron cargar los destinos" }, { status: 500 });
  }
}
