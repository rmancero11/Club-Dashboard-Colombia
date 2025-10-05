import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

function codeFor(year: number, seq: number) {
  return `RES-${year}-${String(seq).padStart(6, "0")}`;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    sellerId, clientId, destinationId,
    startDate, endDate,
    paxAdults = 1, paxChildren = 0,
    currency = "USD", totalAmount = 0,
    notes = null,
  } = body as any;

  if (!sellerId || !clientId || !destinationId || !startDate || !endDate) {
    return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
  }

  // validar tenancy
  const [seller, client, destination] = await Promise.all([
    prisma.user.findFirst({ where: { id: sellerId, businessId: auth.businessId, role: "SELLER" }, select: { id: true } }),
    prisma.client.findFirst({ where: { id: clientId, businessId: auth.businessId }, select: { id: true } }),
    prisma.destination.findFirst({ where: { id: destinationId, businessId: auth.businessId }, select: { id: true } }),
  ]);
  if (!seller) return NextResponse.json({ error: "Seller inválido" }, { status: 400 });
  if (!client) return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });
  if (!destination) return NextResponse.json({ error: "Destino inválido" }, { status: 400 });

  const sd = new Date(startDate);
  const ed = new Date(endDate);
  if (!(sd instanceof Date) || isNaN(sd as any) || !(ed instanceof Date) || isNaN(ed as any) || sd > ed) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  // generar código (secuencia por año)
  const year = sd.getFullYear();
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await prisma.reservation.count({
      where: { businessId: auth.businessId, startDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
    });
    const code = codeFor(year, count + 1 + attempt);
    try {
      const reservation = await prisma.reservation.create({
        data: {
          businessId: auth.businessId,
          code,
          clientId,
          sellerId,
          destinationId,
          startDate: sd,
          endDate: ed,
          paxAdults: Number(paxAdults) || 1,
          paxChildren: Number(paxChildren) || 0,
          currency: String(currency || "USD"),
          totalAmount: Number(totalAmount || 0).toFixed(2),
          status: "DRAFT",
          notes: typeof notes === "string" ? notes : null,
        },
        select: { id: true, code: true },
      });
      return NextResponse.json({ reservation }, { status: 201 });
    } catch (e: any) {
      if (e?.code === "P2002") continue; // conflicto de code, retry
      return NextResponse.json({ error: "No se pudo crear la reserva" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "No se pudo generar código único" }, { status: 400 });
}
