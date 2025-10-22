import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

function codeFor(year: number, seq: number) {
  return `RES-${year}-${String(seq).padStart(6, "0")}`;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    sellerId,
    clientId,
    destinationId,
    startDate,
    endDate,
    paxAdults = 1,
    paxChildren = 0,
    currency = "USD",
    totalAmount = 0,
    notes = null,
  } = body as any;

  if (!sellerId || !clientId || !destinationId || !startDate || !endDate) {
    return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
  }

  // Validaciones de referencias (sin businessId)
  const [seller, client, destination] = await Promise.all([
    prisma.user.findUnique({ where: { id: sellerId } }),
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.destination.findUnique({ where: { id: destinationId } }),
  ]);
  if (!seller || seller.role !== "SELLER" || seller.status !== "ACTIVE") {
    return NextResponse.json({ error: "Seller inválido" }, { status: 400 });
  }
  if (!client) return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });
  if (!destination) return NextResponse.json({ error: "Destino inválido" }, { status: 400 });

  // Fechas
  const sd = new Date(startDate);
  const ed = new Date(endDate);
  if (isNaN(sd.getTime()) || isNaN(ed.getTime()) || sd > ed) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  // Generar código (secuencia por año)
  const year = sd.getFullYear();
  const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await prisma.reservation.count({
      where: { startDate: { gte: yearStart, lte: yearEnd } },
    });
    const code = codeFor(year, count + 1 + attempt);

    try {
      const created = await prisma.reservation.create({
        data: {
          code,
          clientId,
          sellerId,
          destinationId,
          startDate: sd,
          endDate: ed,
          paxAdults: Number(paxAdults) || 1,
          paxChildren: Number(paxChildren) || 0,
          currency: String(currency || "USD"),
          // Decimal en Prisma: pasar number directamente (evitar toFixed)
          totalAmount: Number(totalAmount || 0),
          status: "LEAD",
          notes: typeof notes === "string" ? notes : null,
        },
        select: { id: true, code: true },
      });

      // Respuesta sencilla (el form acepta {id} o {reservation.id})
      return NextResponse.json({ id: created.id, reservation: created }, { status: 201 });
    } catch (e: any) {
      // P2002 = unique constraint failed (posible colisión de code)
      if (e?.code === "P2002") continue;
      return NextResponse.json({ error: "No se pudo crear la reserva" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "No se pudo generar código único" }, { status: 400 });
}
