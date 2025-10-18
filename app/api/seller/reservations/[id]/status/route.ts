// app/api/seller/reservations/[id]/status/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { ReservationStatus } from "@prisma/client";

const Body = z.object({
  status: z.nativeEnum(ReservationStatus),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!auth.businessId) return NextResponse.json({ error: "No business" }, { status: 400 });
  if (!["SELLER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { status } = parsed.data;

  // 1) Cargar reserva validando business y ownership
  const where: any = { id: params.id, businessId: auth.businessId! };
  if (auth.role !== "ADMIN") where.sellerId = auth.userId!;

  const current = await prisma.reservation.findFirst({
    where,
    select: { id: true, businessId: true, sellerId: true, status: true, clientId: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2) Actualizar estado
  const updated = await prisma.reservation.update({
    where: { id: current.id },
    data: { status },
    select: {
      id: true, status: true, updatedAt: true,
    },
  });

  // 3) Bitácora
  await prisma.activityLog.create({
    data: {
      businessId: auth.businessId!,
      action: "CHANGE_STATUS",
      reservationId: current.id,
      clientId: current.clientId,
      userId: auth.userId!,
      message: `Estado -> ${status}`,
      metadata: { from: current.status, to: status },
    },
  });

  return NextResponse.json({ reservation: updated }, { status: 200 });
}
