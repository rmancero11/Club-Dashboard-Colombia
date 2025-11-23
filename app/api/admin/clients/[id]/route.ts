import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";

const SUBS_VALUES = new Set(["STANDARD", "PREMIUM", "VIP"] as const);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Content-Type incorrecto. Debe ser multipart/form-data." },
      { status: 400 }
    );
  }

  const sellerId = (formData.get("sellerId") as string | null) || null;
  const isArchived = formData.get("isArchived") === "true";
  const notes = (formData.get("notes") as string | null) || null;
  const verifiedField = formData.get("verified");

  // ====== Travel Points en Client ======
  const addTravelPointsRaw = formData.get("addTravelPoints");
  const removeTravelPointsRaw = formData.get("removeTravelPoints");

  const addTravelPoints =
    typeof addTravelPointsRaw === "string" ? parseInt(addTravelPointsRaw) : 0;

  const removeTravelPoints =
    typeof removeTravelPointsRaw === "string" ? parseInt(removeTravelPointsRaw) : 0;

  if (isNaN(addTravelPoints) || isNaN(removeTravelPoints)) {
    return NextResponse.json(
      { error: "Valores inválidos para travel points" },
      { status: 400 }
    );
  }

  // ================= Subscription Plan =================
  const subscriptionPlanRaw =
    (formData.get("subscriptionPlan") as string | null)?.toUpperCase() ?? "";
  const subscriptionPlan = SUBS_VALUES.has(subscriptionPlanRaw as any)
    ? (subscriptionPlanRaw as "STANDARD" | "PREMIUM" | "VIP")
    : undefined;

  const existingClient = await prisma.client.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!existingClient) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  if (sellerId) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, role: true, status: true },
    });

    if (!seller || seller.role !== "SELLER" || seller.status !== "ACTIVE") {
      return NextResponse.json({ error: "Vendedor inválido" }, { status: 400 });
    }
  }

  // ================= Client Data =================
  const clientData: any = {
    isArchived,
    notes,
  };

  if (sellerId) clientData.sellerId = sellerId;
  if (subscriptionPlan) clientData.subscriptionPlan = subscriptionPlan;

  // Ajustes de puntos sobre Client
  if (addTravelPoints > 0) {
    clientData.travelPoints = { increment: addTravelPoints };
  }

  if (removeTravelPoints > 0) {
    clientData.travelPoints = {
      ...clientData.travelPoints,
      decrement: removeTravelPoints,
    };
  }

  // ================= User Data =================
  const userData: Record<string, any> = {};

  if (verifiedField !== null) {
    userData.verified = verifiedField === "true";
  }

  const fileFields = [
    "purchaseOrder",
    "flightTickets",
    "serviceVoucher",
    "medicalAssistanceCard",
    "travelTips",
  ] as const;

  async function handleUpload(key: (typeof fileFields)[number]) {
    const file = formData.get(key) as File | null;
    if (!file || typeof file !== "object" || (file as any).size <= 0) return;

    const result: any = await uploadToCloudinary(file, {
      access: "public",
      folder: "docs",
      filename: (file as File).name,
    });

    userData[key] = result.secure_url;
  }

  try {
    for (const key of fileFields) {
      await handleUpload(key);
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error subiendo archivos" },
      { status: 500 }
    );
  }

  // ================= Update Client + User + Logs =================
  try {
    const [updatedClient, updatedUser, pointTransactions] = await Promise.all([
      prisma.client.update({
        where: { id: params.id },
        data: clientData,
        select: {
          id: true,
          name: true,
          isArchived: true,
          notes: true,
          sellerId: true,
          subscriptionPlan: true,
          travelPoints: true,
        },
      }),

      Object.keys(userData).length
        ? prisma.user.update({
            where: { id: existingClient.userId },
            data: userData,
          })
        : Promise.resolve(null),

      (async () => {
        const logs = [];

        if (addTravelPoints > 0) {
          logs.push(
            prisma.travelPointsTransaction.create({
              data: {
                type: "ADMIN_GRANT",
                amount: addTravelPoints,
                fromClientId: null, // Admin no es un client
                toClientId: params.id,
                note: `Admin otorgó ${addTravelPoints} puntos`,
              },
            })
          );
        }

        if (removeTravelPoints > 0) {
          logs.push(
            prisma.travelPointsTransaction.create({
              data: {
                type: "ADJUSTMENT",
                amount: -removeTravelPoints,
                fromClientId: null,
                toClientId: params.id,
                note: `Admin removió ${removeTravelPoints} puntos`,
              },
            })
          );
        }

        return logs.length ? Promise.all(logs) : null;
      })(),
    ]);

    return NextResponse.json({ client: updatedClient, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
