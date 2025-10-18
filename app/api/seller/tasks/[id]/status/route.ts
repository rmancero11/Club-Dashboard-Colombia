import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { TaskStatus } from "@prisma/client";

const Body = z.object({ status: z.nativeEnum(TaskStatus) });

export async function PATCH(
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

  const current = await prisma.task.findFirst({ where, select: { id: true, reservationId: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id: current.id },
    data: { status: parsed.data.status },
    select: { id: true, status: true, updatedAt: true },
  });

  await prisma.activityLog.create({
    data: {
      businessId: auth.businessId!,
      action: "UPDATE_RESERVATION", // o NOTE si prefieres
      reservationId: current.reservationId ?? null,
      userId: auth.userId!,
      message: `Tarea ${current.id}: estado -> ${parsed.data.status}`,
    },
  });

  return NextResponse.json({ task: updated });
}
