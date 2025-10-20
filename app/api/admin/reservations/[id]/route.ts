import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

type Status =
  | "LEAD" | "QUOTED" | "HOLD" | "CONFIRMED"
  | "TRAVELING" | "COMPLETED" | "CANCELED" | "EXPIRED";

const ALLOWED: Partial<Record<Status, Status[]>> = {
  LEAD: ["QUOTED", "CANCELED"],
  QUOTED: ["HOLD", "CONFIRMED", "CANCELED", "EXPIRED"],
  HOLD: ["CONFIRMED", "QUOTED", "CANCELED", "EXPIRED"],
  CONFIRMED: ["TRAVELING", "CANCELED"],
  TRAVELING: ["COMPLETED"],
  EXPIRED: ["QUOTED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

function canTransition(from: Status, to: Status, ctx: { now: Date; startDate: Date; endDate: Date; }) {
  if (!(ALLOWED[from] || []).includes(to)) {
    return { ok: false, reason: `Transición ${from} → ${to} no permitida.` };
  }
  const { now, startDate, endDate } = ctx;
  if (to === "TRAVELING" && now < startDate) {
    return { ok: false, reason: "El viaje aún no inicia." };
  }
  if (to === "COMPLETED" && now < endDate) {
    return { ok: false, reason: "El viaje aún no finaliza." };
  }
  if (from === "CONFIRMED" && to === "CANCELED" && now >= startDate) {
    return { ok: false, reason: "No se puede cancelar una reserva que ya inició." };
  }
  return { ok: true };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  // referencias (tenancy)
  if (typeof body.sellerId === "string") {
    const ok = await prisma.user.findFirst({ where: { id: body.sellerId, businessId: auth.businessId, role: "SELLER" } });
    if (!ok) return NextResponse.json({ error: "Seller inválido" }, { status: 400 });
    data.sellerId = body.sellerId;
  }
  if (typeof body.clientId === "string") {
    const ok = await prisma.client.findFirst({ where: { id: body.clientId, businessId: auth.businessId } });
    if (!ok) return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });
    data.clientId = body.clientId;
  }
  if (typeof body.destinationId === "string") {
    const ok = await prisma.destination.findFirst({ where: { id: body.destinationId, businessId: auth.businessId } });
    if (!ok) return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
    data.destinationId = body.destinationId;
  }

  // fechas
  if (typeof body.startDate === "string") {
    const d = new Date(body.startDate);
    if (isNaN(d as any)) return NextResponse.json({ error: "startDate inválida" }, { status: 400 });
    data.startDate = d;
  }
  if (typeof body.endDate === "string") {
    const d = new Date(body.endDate);
    if (isNaN(d as any)) return NextResponse.json({ error: "endDate inválida" }, { status: 400 });
    data.endDate = d;
  }
  if (typeof data.startDate !== "undefined" && typeof data.endDate !== "undefined" && data.startDate > data.endDate) {
    return NextResponse.json({ error: "El inicio no puede ser posterior al fin" }, { status: 400 });
  }

  // otros
  if (typeof body.paxAdults === "number") data.paxAdults = Math.max(1, Math.floor(body.paxAdults));
  if (typeof body.paxChildren === "number") data.paxChildren = Math.max(0, Math.floor(body.paxChildren));
  if (typeof body.currency === "string") data.currency = body.currency;
  if (typeof body.totalAmount === "number") data.totalAmount = body.totalAmount.toFixed(2);
  if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;

  // ====== ESTADO (FSM) ======
  let toStatus: Status | undefined;
  if (typeof body.status === "string") {
    const s = body.status as Status;
    const allowed = ["LEAD","QUOTED","HOLD","CONFIRMED","TRAVELING","COMPLETED","CANCELED","EXPIRED"] as const;
    if (!(allowed as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    toStatus = s;
  }

  try {
    // si NO hay cambio de status, solo update de campos
    if (!toStatus) {
      const updated = await prisma.reservation.update({
        where: { id: params.id, businessId: auth.businessId },
        data,
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: updated.id });
    }

    // validar transición sobre el estado actual y fechas actuales (o nuevas si el body las manda)
    const current = await prisma.reservation.findFirst({
      where: { id: params.id, businessId: auth.businessId },
      select: { id: true, status: true, startDate: true, endDate: true, clientId: true, sellerId: true },
    });
    if (!current) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

    const now = new Date();
    const ctx = {
      now,
      startDate: (data.startDate as Date) || current.startDate,
      endDate: (data.endDate as Date) || current.endDate,
    };
    const fromStatus = current.status as Status;
    const check = canTransition(fromStatus, toStatus, ctx);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    // persiste estado + otros cambios + ActivityLog
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.reservation.update({
        where: { id: current.id },
        data: { ...data, status: toStatus },
        select: { id: true, status: true },
      });
      await tx.activityLog.create({
        data: {
          businessId: auth.businessId!,
          action: "CHANGE_STATUS",
          message: `Estado ${fromStatus} → ${toStatus}`,
          metadata: { from: fromStatus, to: toStatus, by: auth.userId, at: now.toISOString() },
          userId: auth.userId,
          clientId: current.clientId,
          reservationId: current.id,
        },
      });
      return u;
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (e: any) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
