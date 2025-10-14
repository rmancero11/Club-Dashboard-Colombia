import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const config = {
  api: { bodyParser: false }, // necesario para recibir FormData
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN" || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 🔹 Parsear FormData
  const formData = await req.formData();
  const sellerIdRaw = formData.get("sellerId") as string | null;
  const isArchivedRaw = formData.get("isArchived") as string | null;
  const notesRaw = formData.get("notes") as string | null;

  const dataClient: any = {};

  // 🔹 Manejo de sellerId
  if (sellerIdRaw === null) {
    return NextResponse.json(
      { error: "No se puede desasignar el vendedor: el modelo requiere sellerId." },
      { status: 400 }
    );
  }

  const sellerIdToSet =
    typeof sellerIdRaw === "string" && sellerIdRaw.trim() !== "" ? sellerIdRaw : undefined;

  // 🔹 Validar vendedor si se intenta cambiar
  if (sellerIdToSet) {
    const seller = await prisma.user.findFirst({
      where: { id: sellerIdToSet, businessId: auth.businessId, role: "SELLER" },
      select: { id: true },
    });
    if (!seller) {
      return NextResponse.json({ error: "Seller inválido" }, { status: 400 });
    }
  }

  // 🔹 Campos normales de Client
  if (typeof isArchivedRaw === "string")
    dataClient.isArchived =
      isArchivedRaw === "true" ? true : isArchivedRaw === "false" ? false : undefined;
  if (typeof notesRaw === "string") dataClient.notes = notesRaw;

  // 🔹 Buscar el cliente (para obtener userId y validar businessId)
  const existingClient = await prisma.client.findFirst({
    where: { id: params.id, businessId: auth.businessId },
    select: { id: true, userId: true },
  });

  if (!existingClient) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // 🔹 Subir archivos y actualizar el User vinculado
  const fileFields = [
    "purchaseOrder",
    "flightTickets",
    "serviceVoucher",
    "medicalAssistanceCard",
    "travelTips",
  ];

  const dataUser: any = {};

  for (const key of fileFields) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        const result: any = await uploadToCloudinary(file);
        dataUser[key] = result.secure_url;
      } catch {
        return NextResponse.json({ error: `Error subiendo ${key}` }, { status: 500 });
      }
    }
  }

  // 🔹 Ejecutar ambas actualizaciones (Client + User)
  try {
    const [updatedClient, updatedUser] = await Promise.all([
      prisma.client.update({
        where: { id: params.id },
        data: {
          ...(sellerIdToSet ? { sellerId: sellerIdToSet } : {}),
          ...dataClient,
        },
        select: { id: true, sellerId: true, isArchived: true, notes: true },
      }),
      Object.keys(dataUser).length > 0
        ? prisma.user.update({
            where: { id: existingClient.userId },
            data: dataUser,
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

    return NextResponse.json({
      ok: true,
      client: updatedClient,
      userFiles: updatedUser,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar el cliente" }, { status: 400 });
  }
}
