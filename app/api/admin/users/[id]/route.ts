import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const roleRaw = body?.role as "ADMIN" | "SELLER" | "USER" | undefined;
  const statusRaw = body?.status as "ACTIVE" | "INACTIVE" | undefined;
  const commissionRateRaw = body?.commissionRate as number | string | undefined;

  const data: any = {};
  if (roleRaw && ["ADMIN", "SELLER", "USER"].includes(roleRaw)) data.role = roleRaw;
  if (statusRaw && ["ACTIVE", "INACTIVE"].includes(statusRaw)) data.status = statusRaw;

  if (data.role === "SELLER") {
    if (commissionRateRaw != null) {
      const num = Number(commissionRateRaw);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        return NextResponse.json({ error: "commissionRate debe estar entre 0 y 100" }, { status: 400 });
      }
      data.commissionRate = num.toFixed(2); // Decimal como string
    }
  } else if (data.role) {
    // Si cambia a ADMIN/USER, limpiamos comisión
    data.commissionRate = null;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id, businessId: auth.businessId },
      data,
      select: {
        id: true, role: true, status: true, commissionRate: true,
      },
    });
    return NextResponse.json({ user: updated });
  } catch (e: any) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
