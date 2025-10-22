import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  const name = String(body?.name || "").trim();
  const country = String(body?.country || "").trim();
  if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  if (!country) return NextResponse.json({ error: "El país es requerido" }, { status: 400 });

  // Construcción segura del payload
  const data: any = {
    name,
    country,
  };

  if (body.city === null || typeof body.city === "string") data.city = body.city ?? null;
  if (body.description === null || typeof body.description === "string") data.description = body.description ?? null;
  if (body.category === null || typeof body.category === "string") data.category = body.category ?? null;
  if (body.imageUrl === null || typeof body.imageUrl === "string") data.imageUrl = body.imageUrl ?? null;

  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.popularityScore === "number") data.popularityScore = body.popularityScore;

  // Decimals: aceptar number o string o null
  if (body.price === null || typeof body.price === "number" || typeof body.price === "string") {
    data.price = body.price ?? null;
  }
  if (body.discountPrice === null || typeof body.discountPrice === "number" || typeof body.discountPrice === "string") {
    data.discountPrice = body.discountPrice ?? null;
  }

  try {
    const destination = await prisma.destination.create({
      data,
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        description: true,
        category: true,
        imageUrl: true,
        price: true,
        discountPrice: true,
        isActive: true,
        popularityScore: true,
      },
    });
    return NextResponse.json({ destination }, { status: 201 });
  } catch (err: any) {
    // Único por [name, country, city]
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un destino con ese nombre/país/ciudad" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear el destino" }, { status: 400 });
  }
}
