// app/api/seller/reservations/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

const Body = z.object({
  clientId: z.string().uuid(),
  destinationId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  paxAdults: z.number().int().min(1),
  paxChildren: z.number().int().min(0),
  notes: z.string().optional(),
  currency: z.string().default("USD"),
  totalAmount: z.number().default(0),
});

async function generateReservationCode(businessId: string) {
  const year = new Date().getFullYear();
  // Sencillo: contar reservas del año y sumar 1 (puedes migrar a una tabla de secuencias)
  const count = await prisma.reservation.count({
    where: {
      businessId,
      createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) },
    },
  });
  const n = String(count + 1).padStart(6, "0");
  return `RES-${year}-${n}`;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!auth.businessId) return NextResponse.json({ error: "No business" }, { status: 400 });
  if (!["SELLER","ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const data = Body.safeParse(json);
  if (!data.success) {
    return NextResponse.json({ error: "Invalid body", issues: data.error.issues }, { status: 400 });
  }
  const { clientId, destinationId, startDate, endDate, paxAdults, paxChildren, notes, currency, totalAmount } = data.data;

  const businessId = auth.businessId!;
  const sellerId = auth.userId!;

  // 1) Validar que el cliente es del mismo business y del seller actual
  const client = await prisma.client.findFirst({
    where: { id: clientId, businessId, sellerId },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Cliente no pertenece al vendedor" }, { status: 403 });
  }

  // 2) Validar destino del mismo business y activo
  const destination = await prisma.destination.findFirst({
    where: { id: destinationId, businessId, isActive: true },
    select: { id: true },
  });
  if (!destination) {
    return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
  }

  // 3) Crear reserva (LEAD) + Activity
  const code = await generateReservationCode(businessId);
  const reservation = await prisma.reservation.create({
    data: {
      businessId,
      code,
      clientId: clientId,
      sellerId,
      destinationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paxAdults,
      paxChildren,
      currency,
      totalAmount,
      status: "LEAD",
      notes: notes || null,
    },
    select: { id: true },
  });

  await prisma.activityLog.create({
    data: {
      businessId,
      action: "CREATE_RESERVATION",
      reservationId: reservation.id,
      clientId: clientId,
      userId: sellerId,
      message: "Lead creado desde panel de vendedor",
    },
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
