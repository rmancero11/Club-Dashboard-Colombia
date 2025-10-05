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
  if (typeof body.name === "string") data.name = body.name.trim();
  if (body.address === null || typeof body.address === "string") data.address = body.address ?? null;
  if (body.mapsUrl === null || typeof body.mapsUrl === "string") data.mapsUrl = body.mapsUrl ?? null;
  if (body.country === null || typeof body.country === "string") data.country = body.country ?? null;

  try {
    const updated = await prisma.branch.update({
      where: { id: params.id, businessId: auth.businessId },
      data,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la sucursal" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await prisma.branch.delete({ where: { id: params.id, businessId: auth.businessId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar (verifica relaciones)" }, { status: 400 });
  }
}
