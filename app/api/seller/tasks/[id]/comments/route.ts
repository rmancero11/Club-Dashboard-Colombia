import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { ActivityAction } from "@prisma/client";

const Body = z.object({ text: z.string().min(1) });

export async function POST(
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
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  // Si es SELLER, solo puede comentar en sus tareas
  const where: any = { id: params.id, ...(auth.role !== "ADMIN" ? { sellerId: auth.userId! } : {}) };

  const task = await prisma.task.findFirst({
    where,
    select: { id: true, description: true, reservationId: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // timeline como JSON en description (compatibilidad con legacy texto plano)
  let items: any[] = [];
  try {
    const prev = task.description ? JSON.parse(task.description) : [];
    if (Array.isArray(prev)) items = prev;
  } catch {
    // si era texto plano, lo ignoramos y empezamos timeline
  }

  items.push({
    ts: new Date().toISOString(),
    text: parsed.data.text,
    author: "Vendedor",
    type: "NOTE",
  });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { description: JSON.stringify(items) },
    select: { id: true, updatedAt: true },
  });

  // Bitácora global
  await prisma.activityLog.create({
    data: {
      action: ActivityAction.NOTE,
      message: `Comentario agregado a tarea ${task.id}`,
      userId: auth.userId!,
      reservationId: task.reservationId ?? null,
      metadata: { text: parsed.data.text, entity: "task", taskId: task.id },
    },
  });

  return NextResponse.json({ task: updated }, { status: 201 });
}
