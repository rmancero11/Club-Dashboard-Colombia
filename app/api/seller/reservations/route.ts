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

// Genera código único tipo RES-2025-000001
async function generateReservationCode() {
  const year = new Date().getFullYear();
  const count = await prisma.reservation.count({
    where: {
      createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) },
    },
  });
  const n = String(count + 1).padStart(6, "0");
  return `RES-${year}-${n}`;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SELLER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const data = Body.safeParse(json);
  if (!data.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: data.error.issues },
      { status: 400 }
    );
  }

  const {
    clientId,
    destinationId,
    startDate,
    endDate,
    paxAdults,
    paxChildren,
    notes,
    currency,
    totalAmount,
  } = data.data;

  const sellerId = auth.userId!;

  // 1) Validar que el cliente pertenece al vendedor autenticado
  const client = await prisma.client.findFirst({
    where: { id: clientId, sellerId, isArchived: false },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json(
      { error: "El cliente no pertenece al vendedor" },
      { status: 403 }
    );
  }

  // 2) Validar que el destino existe y está activo
  const destination = await prisma.destination.findFirst({
    where: { id: destinationId, isActive: true },
    select: { id: true },
  });
  if (!destination) {
    return NextResponse.json({ error: "Destino inválido o inactivo" }, { status: 400 });
  }

  // 3) Crear la reserva
  const code = await generateReservationCode();
  const reservation = await prisma.reservation.create({
    data: {
      code,
      clientId,
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

  // 4) Registrar en ActivityLog
  await prisma.activityLog.create({
    data: {
      action: "CREATE_RESERVATION",
      reservationId: reservation.id,
      clientId,
      userId: sellerId,
      message: "Lead creado desde panel de vendedor",
    },
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
