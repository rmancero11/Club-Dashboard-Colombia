import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { TaskStatus, ActivityAction } from "@prisma/client";

const Body = z.object({ status: z.nativeEnum(TaskStatus) });

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SELLER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Buscar la tarea; si es SELLER, solo puede tocar sus tareas
  const where: any = { id: params.id, ...(auth.role !== "ADMIN" ? { sellerId: auth.userId! } : {}) };

  const current = await prisma.task.findFirst({
    where,
    select: { id: true, reservationId: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id: current.id },
    data: { status: parsed.data.status },
    select: { id: true, status: true, updatedAt: true },
  });

  // Bitácora del cambio de estado (ActivityAction.CHANGE_STATUS)
  await prisma.activityLog.create({
    data: {
      action: ActivityAction.CHANGE_STATUS,
      reservationId: current.reservationId ?? null,
      userId: auth.userId!,
      message: `Tarea ${current.id}: estado -> ${parsed.data.status}`,
      metadata: {
        entity: "task",
        taskId: current.id,
        newStatus: parsed.data.status,
      },
    },
  });

  return NextResponse.json({ task: updated });
}
