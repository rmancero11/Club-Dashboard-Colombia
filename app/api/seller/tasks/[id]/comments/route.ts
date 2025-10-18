import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

const Body = z.object({ text: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const where: any = { id: params.id, businessId: auth.businessId! };
  if (auth.role !== "ADMIN") where.sellerId = auth.userId!;

  const task = await prisma.task.findFirst({
    where,
    select: { id: true, description: true, reservationId: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // armar timeline nuevo
  let items: any[] = [];
  try {
    const parsed = task.description ? JSON.parse(task.description) : [];
    if (Array.isArray(parsed)) items = parsed;
  } catch { /* ignore, se tratará como legacy */ }

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

  // opcional: ActivityLog para feed global
  await prisma.activityLog.create({
    data: {
      businessId: auth.businessId!,
      action: "NOTE",
      message: `Comentario agregado a tarea ${task.id}`,
      userId: auth.userId!,
      reservationId: task.reservationId ?? null,
      metadata: { text: parsed.data.text },
    },
  });

  return NextResponse.json({ task: updated }, { status: 201 });
}
