import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import type { ReservationStatus } from "@prisma/client";

const PatchBody = z.object({
  destinationId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  paxAdults: z.number().int().min(1),
  paxChildren: z.number().int().min(0),
  currency: z.string().min(1),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SELLER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    destinationId,
    startDate,
    endDate,
    paxAdults,
    paxChildren,
    currency,
    totalAmount,
    notes,
  } = parsed.data;

  // 1) Verificar existencia y propiedad de la reserva
  const whereReservation: any = { id: params.id };
  if (auth.role !== "ADMIN") whereReservation.sellerId = auth.userId;

  const reservation = await prisma.reservation.findFirst({
    where: whereReservation,
    select: { id: true, clientId: true, sellerId: true, status: true },
  });
  if (!reservation) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  // 2) Validar destino activo
  const destination = await prisma.destination.findFirst({
    where: { id: destinationId, isActive: true },
    select: { id: true },
  });
  if (!destination) {
    return NextResponse.json({ error: "Destino inválido o inactivo" }, { status: 400 });
  }

  // 3) Validar fechas
  const sd = new Date(startDate);
  const ed = new Date(endDate);
  if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }
  if (sd > ed) {
    return NextResponse.json({ error: "La fecha de inicio no puede ser mayor a la de fin" }, { status: 400 });
  }

  // 4) Actualizar reserva
  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      destinationId,
      startDate: sd,
      endDate: ed,
      paxAdults,
      paxChildren,
      currency,
      totalAmount,
      notes: notes ?? null,
    },
    select: { id: true },
  });

  // 5) Log
  await prisma.activityLog.create({
    data: {
      action: "UPDATE_RESERVATION",
      reservationId: reservation.id,
      clientId: reservation.clientId,
      userId: auth.userId!,
      message: "Reserva actualizada por vendedor",
      metadata: {
        destinationId,
        startDate,
        endDate,
        paxAdults,
        paxChildren,
        currency,
        totalAmount,
      },
    },
  });

  return NextResponse.json({ reservation: updated }, { status: 200 });
}
