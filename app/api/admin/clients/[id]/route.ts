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
  // Nuevo schema: NO hay businessId. Solo ADMIN puede modificar.
  if (!auth || auth.role !== "ADMIN") {
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

  const sellerId = (formData.get("sellerId") as string | null) || null;
  const isArchived = formData.get("isArchived") === "true";
  const notes = (formData.get("notes") as string | null) || null;
  // IMPORTANTE: solo actualizar `verified` si vino en el formData
  const verifiedField = formData.get("verified");

  // Validar existencia del cliente y obtener userId
  const existingClient = await prisma.client.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existingClient) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Validar seller si vino sellerId (debe existir y ser SELLER ACTIVO)
  if (sellerId) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, role: true, status: true },
    });
    if (!seller || seller.role !== "SELLER" || seller.status !== "ACTIVE") {
      return NextResponse.json({ error: "Vendedor inválido" }, { status: 400 });
    }
  }

  // Datos del cliente a actualizar
  const clientData: any = {
    isArchived,
    notes,
  };
  if (sellerId) clientData.sellerId = sellerId;

  // Campos de archivos que se suben (viven en User)
  const fileFields = [
    "purchaseOrder",
    "flightTickets",
    "serviceVoucher",
    "medicalAssistanceCard",
    "travelTips",
  ] as const;

  // Datos para actualizar en user (archivos y verified)
  const userData: Record<string, any> = {};
  if (verifiedField !== null) {
    userData.verified = verifiedField === "true";
  }

  // Helper para subir con autodetección (PDF -> raw)
  async function handleUpload(key: (typeof fileFields)[number]) {
    const file = formData.get(key) as File | null;
    if (!file || typeof file !== "object" || (file as any).size <= 0) return;
    const result: any = await uploadToCloudinary(file, {
      access: "public",            // público; usa "authenticated" si quieres proteger
      folder: "docs",               // carpeta destino
      filename: (file as File).name, // nombre visible
    });
    userData[key] = result.secure_url;
  }

  try {
    // Subidas (secuenciales para simplicidad; puedes paralelizar si gustas)
    for (const key of fileFields) {
      await handleUpload(key);
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error subiendo archivos" }, { status: 500 });
  }

  try {
    const [updatedClient, updatedUser] = await Promise.all([
      prisma.client.update({
        where: { id: params.id },
        data: clientData,
        select: { id: true, name: true, isArchived: true, notes: true, sellerId: true },
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

    // Devolver estructura estable para el frontend
    return NextResponse.json({ client: updatedClient, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
