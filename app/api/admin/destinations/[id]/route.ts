import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(()=> ({}));

  const data: any = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.country === "string") data.country = body.country.trim();
  if (body.city === null || typeof body.city === "string") data.city = body.city ? body.city.trim() : null;
  if (body.category === null || typeof body.category === "string") data.category = body.category ? body.category.trim() : null;
  if (body.description === null || typeof body.description === "string") data.description = body.description ? body.description.trim() : null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.popularityScore === "number") data.popularityScore = Math.max(0, Math.floor(body.popularityScore));

  try {
    const updated = await prisma.destination.update({
      where: { id: params.id, businessId: auth.businessId },
      data,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Conflicto de único (nombre/país/ciudad)" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await prisma.destination.delete({
      where: { id: params.id, businessId: auth.businessId },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Si hay reservas relacionadas, podría fallar por fk (onDelete: Restrict en Reservation)
    return NextResponse.json({ error: "No se pudo eliminar. Verifica si tiene reservas asociadas." }, { status: 400 });
  }
}
