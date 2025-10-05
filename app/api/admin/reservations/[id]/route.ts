import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  // cambios de referencias (validar tenancy)
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

  // campos simples
  if (typeof body.status === "string") {
    const allowed = ["DRAFT","PENDING","CONFIRMED","CANCELED","COMPLETED"];
    if (!allowed.includes(body.status)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    data.status = body.status;
  }

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

  if (typeof body.paxAdults === "number") data.paxAdults = Math.max(1, Math.floor(body.paxAdults));
  if (typeof body.paxChildren === "number") data.paxChildren = Math.max(0, Math.floor(body.paxChildren));
  if (typeof body.currency === "string") data.currency = body.currency;
  if (typeof body.totalAmount === "number") data.totalAmount = body.totalAmount.toFixed(2);
  if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;

  try {
    const updated = await prisma.reservation.update({
      where: { id: params.id, businessId: auth.businessId },
      data,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
