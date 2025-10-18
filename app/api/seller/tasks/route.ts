import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { TaskPriority } from "@prisma/client";

const Body = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(), // yyyy-mm-dd
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  clientId: z.string().uuid().nullable().optional(),
  reservationId: z.string().uuid().nullable().optional(),
});

function toDateOrNull(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!auth.businessId) return NextResponse.json({ error: "No business" }, { status: 400 });
  if (!["SELLER","ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { title, description, dueDate, priority, clientId, reservationId } = parsed.data;
  const businessId = auth.businessId!;
  const sellerId = auth.userId!;

  // Validar cliente (si viene)
  let client: { id: string } | null = null;
  if (clientId) {
    client = await prisma.client.findFirst({
      where: { id: clientId, businessId, ...(auth.role !== "ADMIN" ? { sellerId } : {}) },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado o no pertenece al vendedor" }, { status: 403 });
  }

  // Validar reserva (si viene)
  let reservation: { id: string; clientId: string } | null = null;
  if (reservationId) {
    reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, businessId, ...(auth.role !== "ADMIN" ? { sellerId } : {}) },
      select: { id: true, clientId: true },
    });
    if (!reservation) return NextResponse.json({ error: "Reserva no encontrada o no pertenece al vendedor" }, { status: 403 });
  }

  // Coherencia: si mandan cliente y reserva, deben coincidir
  if (client && reservation && reservation.clientId !== client.id) {
    return NextResponse.json({ error: "La reserva no pertenece al cliente seleccionado" }, { status: 400 });
  }

  // Crear tarea
  const task = await prisma.task.create({
    data: {
      businessId,
      sellerId,
      reservationId: reservation?.id ?? null,
      title,
      description: description || null,
      dueDate: toDateOrNull(dueDate),
      priority,
      // status usa default OPEN
    },
    select: { id: true, reservationId: true },
  });

  // Bitácora NOTE con enlaces (sirve para que Admin vea relación con cliente cuando no hay reserva)
  await prisma.activityLog.create({
    data: {
      businessId,
      action: "NOTE",
      message: "Tarea creada por vendedor",
      userId: sellerId,
      clientId: client?.id ?? (reservation ? reservation.clientId : null),
      reservationId: reservation?.id ?? null,
      metadata: {
        taskId: task.id,
        title,
        priority,
        hasReservation: !!reservation,
        hasClientOnly: !!client && !reservation,
      },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
