import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

// ✅ App Router: reemplaza config.runtime por este export
export const runtime = "nodejs"; // Prisma/Cloudinary no van en Edge
// (Opcional) export const maxDuration = 60; // si necesitas más tiempo en Vercel

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ✅ En App Router NO hace falta bodyParser:false; usa formData() directo
  const formData = await req.formData();

  const roleRaw = formData.get("role") as string | null;
  const statusRaw = formData.get("status") as string | null;
  const commissionRateRaw = formData.get("commissionRate") as string | null;

  const data: any = {};

  // Validar rol y estado
  if (roleRaw && ["ADMIN", "SELLER", "USER"].includes(roleRaw)) data.role = roleRaw;
  if (statusRaw && ["ACTIVE", "INACTIVE"].includes(statusRaw)) data.status = statusRaw;

  // Manejar comisión
  if (data.role === "SELLER" && commissionRateRaw != null) {
    const num = Number(commissionRateRaw);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      return NextResponse.json(
        { error: "commissionRate debe estar entre 0 y 100" },
        { status: 400 }
      );
    }
    // 👇 si el campo en Prisma es Float/Decimal, guarda como número
    data.commissionRate = Number(num.toFixed(2));
  } else if (data.role) {
    data.commissionRate = null;
  }

  // Subir archivos a Cloudinary
  const fileFields = [
    "purchaseOrder",
    "flightTickets",
    "serviceVoucher",
    "medicalAssistanceCard",
    "travelTips",
  ] as const;

  for (const key of fileFields) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        // Asegúrate de que uploadToCloudinary soporte Web File/ArrayBuffer
        const result: any = await uploadToCloudinary(file);
        data[key] = result.secure_url;
      } catch {
        return NextResponse.json({ error: `Error subiendo ${key}` }, { status: 500 });
      }
    }
  }

  // Validar que el usuario pertenezca al mismo negocio
  const existingUser = await prisma.user.findFirst({
    where: { id: params.id, businessId: auth.businessId },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Actualizar usuario
  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        role: true,
        status: true,
        commissionRate: true,
        purchaseOrder: true,
        flightTickets: true,
        serviceVoucher: true,
        medicalAssistanceCard: true,
        travelTips: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
