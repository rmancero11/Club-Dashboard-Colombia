import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export const runtime = "nodejs";

const SUBS_VALUES = new Set(["STANDARD", "PREMIUM", "VIP"] as const);

// -----------------------------------------------------------------------------
// Helper: calcular expiresAt a partir de días o meses (fallback 6 meses)
// -----------------------------------------------------------------------------
function calculateExpiresAt({
  days,
  months,
}: {
  days?: number | null;
  months?: number | null;
}) {
  const now = new Date();
  const expires = new Date(now);

  if (months && months > 0) {
    expires.setMonth(expires.getMonth() + months);
  } else if (days && days > 0) {
    expires.setDate(expires.getDate() + days);
  } else {
    // fallback de seguridad: 6 meses
    expires.setMonth(expires.getMonth() + 6);
  }

  return expires;
}

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

  // ====== Travel Points ======
  const addTravelPointsRaw = formData.get("addTravelPoints");
  const addTravelPoints =
    typeof addTravelPointsRaw === "string" ? parseInt(addTravelPointsRaw, 10) : 0;

  const resetTravelPoints = formData.get("resetTravelPoints") === "true";

  if (isNaN(addTravelPoints)) {
    return NextResponse.json(
      { error: "Valores inválidos para travel points" },
      { status: 400 }
    );
  }

  // ============== Duración ============
  const durationDaysRaw = formData.get("travelPointsDurationDays");
  const durationMonthsRaw = formData.get("travelPointsDurationMonths");

  const durationDays =
    typeof durationDaysRaw === "string" && durationDaysRaw.trim() !== ""
      ? parseInt(durationDaysRaw, 10)
      : null;

  const durationMonths =
    typeof durationMonthsRaw === "string" && durationMonthsRaw.trim() !== ""
      ? parseInt(durationMonthsRaw, 10)
      : null;

  if (durationDays !== null && durationMonths !== null) {
    return NextResponse.json(
      { error: "Solo se puede definir duración en días o en meses, no ambos" },
      { status: 400 }
    );
  }

  if (addTravelPoints > 0) {
  if (
    (durationDays !== null && (isNaN(durationDays) || durationDays <= 0)) ||
    (durationMonths !== null && (isNaN(durationMonths) || durationMonths <= 0))
  ) {
    return NextResponse.json(
      { error: "La duración debe ser un número mayor a 0" },
      { status: 400 }
    );
  }
}

  // ================= Subscription Plan =================
  const subscriptionPlanRaw =
    (formData.get("subscriptionPlan") as string | null)?.toUpperCase() ?? "";
  const subscriptionPlan = SUBS_VALUES.has(subscriptionPlanRaw as any)
    ? (subscriptionPlanRaw as "STANDARD" | "PREMIUM" | "VIP")
    : undefined;

  const existingClient = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      userId: true,
      subscriptionCreatedAt: true,
      subscriptionExpiresAt: true,
      travelPoints: true,
    },
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

  if (subscriptionPlan) {
    clientData.subscriptionPlan = subscriptionPlan;

    const NOW = new Date();

    if (subscriptionPlan === "STANDARD") {
      clientData.subscriptionCreatedAt = null;
      clientData.subscriptionExpiresAt = null;
    } else {
      clientData.subscriptionCreatedAt =
        existingClient.subscriptionCreatedAt ?? NOW;

      clientData.subscriptionExpiresAt =
        existingClient.subscriptionExpiresAt ??
        new Date(new Date().setFullYear(NOW.getFullYear() + 1));
    }
  }

  // ======= Lógica de travelPoints =======
  if (resetTravelPoints) {
    clientData.travelPoints = addTravelPoints > 0 ? addTravelPoints : 0;
  } else if (addTravelPoints > 0) {
    clientData.travelPoints = { increment: addTravelPoints };
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
    const [updatedClient, updatedUser] = await Promise.all([
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
          subscriptionCreatedAt: true,
          subscriptionExpiresAt: true,
          travelPoints: true,
        },
      }),

      Object.keys(userData).length
        ? prisma.user.update({
            where: { id: existingClient.userId },
            data: userData,
          })
        : Promise.resolve(null),
    ]);

    const logs: Promise<any>[] = [];

    // ✅ RESET TOTAL → se guarda como ADJUSTMENT
    if (resetTravelPoints && existingClient.travelPoints > 0) {
      logs.push(
        prisma.travelPointsTransaction.create({
          data: {
            type: "ADJUSTMENT",
            amount: -existingClient.travelPoints,
            fromClientId: null,
            toClientId: params.id,
            expiresAt: new Date(),
            note: `RESET TOTAL por admin (${existingClient.travelPoints} puntos)`,
          },
        })
      );
    }

    // ✅ GRANT con expiración
    if (addTravelPoints > 0) {
      const expiresAt = calculateExpiresAt({
        days: durationDays,
        months: durationMonths,
      });

      logs.push(
        prisma.travelPointsTransaction.create({
          data: {
            type: "ADMIN_GRANT",
            amount: addTravelPoints,
            fromClientId: null,
            toClientId: params.id,
            expiresAt,
            note: `Admin otorgó ${addTravelPoints} puntos`,
          },
        })
      );
    }

    if (logs.length) await Promise.all(logs);

    return NextResponse.json({ client: updatedClient, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
