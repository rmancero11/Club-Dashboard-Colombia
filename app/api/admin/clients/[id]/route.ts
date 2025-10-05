import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  // Nota: sellerId podría venir como "" o null desde el form
  const { sellerId, isArchived, notes } = body as {
    sellerId?: string | null;
    isArchived?: boolean;
    notes?: string;
  };

  // Si te mandan null/"" y el campo es obligatorio, no lo toques (o valida)
  if (sellerId === null) {
    return NextResponse.json(
      { error: "No se puede desasignar el vendedor: el modelo requiere sellerId." },
      { status: 400 }
    );
  }

  const sellerIdToSet =
    typeof sellerId === "string" && sellerId.trim() !== "" ? sellerId : undefined;

  // valida vendedor si se intenta cambiar
  if (sellerIdToSet) {
    const seller = await prisma.user.findFirst({
      where: { id: sellerIdToSet, businessId: auth.businessId, role: "SELLER" },
      select: { id: true },
    });
    if (!seller) {
      return NextResponse.json({ error: "Seller inválido" }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.client.update({
      where: { id: params.id, businessId: auth.businessId },
      data: {
        ...(sellerIdToSet ? { sellerId: sellerIdToSet } : {}), // 🔑 nunca null
        isArchived: typeof isArchived === "boolean" ? isArchived : undefined,
        notes: typeof notes === "string" ? notes : undefined,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el cliente" }, { status: 400 });
  }
}
