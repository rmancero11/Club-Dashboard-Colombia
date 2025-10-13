import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const config = {
  api: { bodyParser: false }, // importante para recibir FormData
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Parsear FormData del request
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
    if (Number.isNaN(num) || num < 0 || num > 100)
      return NextResponse.json({ error: "commissionRate debe estar entre 0 y 100" }, { status: 400 });
    data.commissionRate = num.toFixed(2);
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
  ];

  for (const key of fileFields) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        const result: any = await uploadToCloudinary(file);
        data[key] = result.secure_url;
      } catch {
        return NextResponse.json({ error: `Error subiendo ${key}` }, { status: 500 });
      }
    }
  }

  // Buscar usuario para validar businessId
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
