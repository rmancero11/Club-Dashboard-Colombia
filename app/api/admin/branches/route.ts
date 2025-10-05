import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  if (!name) return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });

  try {
    const branch = await prisma.branch.create({
      data: {
        businessId: auth.businessId,
        name,
        address: body?.address ?? null,
        mapsUrl: body?.mapsUrl ?? null,
        country: body?.country ?? null,
      },
      select: { id: true, name: true, address: true, mapsUrl: true, country: true },
    });
    return NextResponse.json({ branch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la sucursal" }, { status: 400 });
  }
}
