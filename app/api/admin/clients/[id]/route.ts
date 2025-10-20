import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "Content-Type incorrecto. Debe ser multipart/form-data." },
      { status: 400 }
    );
  }

  const sellerId = formData.get("sellerId") as string | null;
  const isArchived = formData.get("isArchived") === "true";
  const notes = formData.get("notes") as string | null;
  const verified = formData.get("verified") === "true";

  // Datos del cliente
  const clientData: any = {
    isArchived,
    notes: notes || null,
  };
  if (sellerId) clientData.sellerId = sellerId;

  // Campos de archivos que se suben
  const fileFields = [
    "purchaseOrder",
    "flightTickets",
    "serviceVoucher",
    "medicalAssistanceCard",
    "travelTips",
  ] as const;

  // Obtener el cliente existente para tener userId
  const existingClient = await prisma.client.findFirst({
    where: { id: params.id, businessId: auth.businessId },
    select: { userId: true },
  });

  if (!existingClient) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Datos para actualizar en user (archivos y verified)
  const userData: any = {};
  if (typeof verified === "boolean") userData.verified = verified;

  for (const key of fileFields) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        const result: any = await uploadToCloudinary(file);
        userData[key] = result.secure_url;
      } catch (err) {
        console.error(err);
        return NextResponse.json(
          { error: `Error subiendo ${key}` },
          { status: 500 }
        );
      }
    }
  }

  try {
    // Actualizar cliente y user en paralelo
    const [updatedClient, updatedUser] = await Promise.all([
      prisma.client.update({
        where: { id: params.id },
        data: clientData,
        select: { id: true, name: true, isArchived: true, notes: true },
      }),
      Object.keys(userData).length
        ? prisma.user.update({
            where: { id: existingClient.userId },
            data: userData,
            select: {
              id: true,
              purchaseOrder: true,
              flightTickets: true,
              serviceVoucher: true,
              medicalAssistanceCard: true,
              travelTips: true,
              verified: true,
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({ client: updatedClient, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
