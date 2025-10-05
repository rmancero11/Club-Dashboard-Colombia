import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(()=> ({}));
  const name = String(body?.name || "").trim();
  const country = String(body?.country || "").trim();
  const city = (body?.city ? String(body.city).trim() : null) || null;
  const category = (body?.category ? String(body.category).trim() : null) || null;
  const description = (body?.description ? String(body.description).trim() : null) || null;

  if (!name || !country) {
    return NextResponse.json({ error: "Nombre y país son obligatorios" }, { status: 400 });
  }

  try {
    const destination = await prisma.destination.create({
      data: {
        businessId: auth.businessId,
        name, country, city, category, description,
        isActive: true, popularityScore: 0,
      },
      select: { id: true, name: true },
    });
    return NextResponse.json({ destination }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un destino con ese nombre/país/ciudad" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear el destino" }, { status: 400 });
  }
}
