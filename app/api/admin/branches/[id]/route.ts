import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  // Campos permitidos en Destination
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.country === "string") data.country = body.country.trim();
  if (body.city === null || typeof body.city === "string") data.city = body.city ?? null;
  if (body.description === null || typeof body.description === "string") data.description = body.description ?? null;
  if (body.category === null || typeof body.category === "string") data.category = body.category ?? null;
  if (body.imageUrl === null || typeof body.imageUrl === "string") data.imageUrl = body.imageUrl ?? null;

  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.popularityScore === "number") data.popularityScore = body.popularityScore;

  // Decimals (acepta number o string)
  if (body.price === null || typeof body.price === "number" || typeof body.price === "string") {
    data.price = body.price ?? null;
  }
  if (body.discountPrice === null || typeof body.discountPrice === "number" || typeof body.discountPrice === "string") {
    data.discountPrice = body.discountPrice ?? null;
  }

  try {
    const updated = await prisma.destination.update({
      where: { id: params.id },
      data,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el destino" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await prisma.destination.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el destino (verifica relaciones)" }, { status: 400 });
  }
}
