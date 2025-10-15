import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();

  const sellerId = formData.get("sellerId") as string | null;
  const isArchived = formData.get("isArchived") === "true";
  const notes = formData.get("notes") as string | null;

  const data: any = {
    isArchived,
    notes: notes || null,
  };

  if (sellerId) data.sellerId = sellerId;

  // Archivos
  const fileFields = [
    "purchaseOrder",
    "flightTickets",
    "serviceVoucher",
    "medicalAssistanceCard",
    "travelTips",
  ] as const;

  // 👇 el client está vinculado a un user que guarda los documentos
  const existingClient = await prisma.client.findFirst({
    where: { id: params.id, businessId: auth.businessId },
    select: { userId: true },
  });

  if (!existingClient) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const userFileData: any = {};

  for (const key of fileFields) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        const result: any = await uploadToCloudinary(file);
        userFileData[key] = result.secure_url;
      } catch (err) {
        console.error(err);
        return NextResponse.json({ error: `Error subiendo ${key}` }, { status: 500 });
      }
    }
  }

  try {
    // Actualiza el cliente y los archivos asociados en el user
    const [updatedClient, updatedUser] = await Promise.all([
      prisma.client.update({
        where: { id: params.id },
        data,
        select: { id: true, name: true, isArchived: true, notes: true },
      }),
      Object.keys(userFileData).length
        ? prisma.user.update({
            where: { id: existingClient.userId },
            data: userFileData,
            select: {
              id: true,
              purchaseOrder: true,
              flightTickets: true,
              serviceVoucher: true,
              medicalAssistanceCard: true,
              travelTips: true,
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
