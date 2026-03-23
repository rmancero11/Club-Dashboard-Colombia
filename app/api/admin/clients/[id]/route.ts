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
    expires.setMonth(expires.getMonth() + 6);
  }

  return expires;
}
function getSubscriptionDuration(plan: string) {
  switch (plan) {
    case "PREMIUM":
      return 90;
    case "VIP":
      return 120;
    default:
      return null; // STANDARD
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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
      { status: 400 },
    );
  }

  const sellerId = (formData.get("sellerId") as string | null) || null;
  const isArchived = formData.get("isArchived") === "true";
  const notes = (formData.get("notes") as string | null) || null;
  const subscriptionPlan = formData.get("subscriptionPlan");
  // ================= NUEVO — Suscripción por fechas =================
  const subValidFromRaw = formData.get("subscriptionValidFrom");
  const subExpiresAtRaw = formData.get("subscriptionExpiresAt");

  const subValidFrom =
    typeof subValidFromRaw === "string" && subValidFromRaw.trim() !== ""
      ? new Date(subValidFromRaw)
      : null;

  const subExpiresAt =
    typeof subExpiresAtRaw === "string" && subExpiresAtRaw.trim() !== ""
      ? new Date(subExpiresAtRaw)
      : null;
  const verifiedField = formData.get("verified");

  // ================= Travel Points =================
  const addTravelPointsRaw = formData.get("addTravelPoints");
  const addTravelPoints =
    typeof addTravelPointsRaw === "string"
      ? parseInt(addTravelPointsRaw, 10)
      : 0;

  const resetTravelPoints = formData.get("resetTravelPoints") === "true";

  if (isNaN(addTravelPoints)) {
    return NextResponse.json(
      { error: "Valores inválidos para travel points" },
      { status: 400 },
    );
  }
  if (subscriptionPlan && !SUBS_VALUES.has(subscriptionPlan as any)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  if (subValidFrom && subExpiresAt && subValidFrom >= subExpiresAt) {
    return NextResponse.json(
      { error: "La fecha de inicio debe ser menor a la de expiración" },
      { status: 400 },
    );
  }
  // ================= Duración (legacy) =================
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
      { error: "Solo se puede definir duración en días o meses" },
      { status: 400 },
    );
  }

  // ✅ NUEVO — fechas explícitas
  const validFromRaw = formData.get("travelPointsValidFrom");
  const expiresAtRaw = formData.get("travelPointsExpiresAt");

  const validFrom =
    typeof validFromRaw === "string" && validFromRaw.trim() !== ""
      ? new Date(validFromRaw)
      : null;

  const expiresAtExplicit =
    typeof expiresAtRaw === "string" && expiresAtRaw.trim() !== ""
      ? new Date(expiresAtRaw)
      : null;

  if (addTravelPoints > 0) {
    if (!expiresAtExplicit && !durationDays && !durationMonths) {
      return NextResponse.json(
        { error: "Debe definir una fecha de expiración o duración" },
        { status: 400 },
      );
    }

    if (validFrom && expiresAtExplicit && validFrom >= expiresAtExplicit) {
      return NextResponse.json(
        { error: "`validFrom` debe ser anterior a `expiresAt`" },
        { status: 400 },
      );
    }
  }

  // ✅ NUEVO — destinos
  const destinationsRaw = formData.get("travelPointsDestinations");
  let destinationIds: string[] = [];

  if (typeof destinationsRaw === "string" && destinationsRaw.trim() !== "") {
    try {
      destinationIds = JSON.parse(destinationsRaw);
    } catch {
      return NextResponse.json(
        { error: "Destinos inválidos" },
        { status: 400 },
      );
    }
  }

  if (addTravelPoints > 0 && destinationIds.length === 0) {
    return NextResponse.json(
      { error: "Debe seleccionar al menos un destino" },
      { status: 400 },
    );
  }

  // ================= Client =================
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
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  }

  // ================= Client Data =================
  const clientData: any = { isArchived, notes };

  if (sellerId) clientData.sellerId = sellerId;

  if (subscriptionPlan) {
    clientData.subscriptionPlan = subscriptionPlan;

    // ✅ Caso 1: admin define fechas manuales
    if (subExpiresAt) {
      clientData.subscriptionCreatedAt = subValidFrom ?? new Date();
      clientData.subscriptionExpiresAt = subExpiresAt;
    } else {
      // ✅ Caso 2: fallback automático (como ya tenías)
      const durationDays = getSubscriptionDuration(subscriptionPlan as string);

      if (durationDays) {
        const now = new Date();

        const baseDate =
          existingClient.subscriptionExpiresAt &&
          existingClient.subscriptionExpiresAt > now
            ? existingClient.subscriptionExpiresAt
            : now;

        const expires = new Date(baseDate);
        expires.setDate(baseDate.getDate() + durationDays);

        clientData.subscriptionCreatedAt = now;
        clientData.subscriptionExpiresAt = expires;
      } else {
        clientData.subscriptionCreatedAt = null;
        clientData.subscriptionExpiresAt = null;
      }
    }
  }
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

  // ================= Persistencia =================
  try {
    const [updatedClient, updatedUser] = await Promise.all([
      prisma.client.update({
        where: { id: params.id },
        data: clientData,
      }),
      Object.keys(userData).length
        ? prisma.user.update({
            where: { id: existingClient.userId },
            data: userData,
          })
        : Promise.resolve(null),
    ]);

    const logs: Promise<any>[] = [];

    if (resetTravelPoints) {
      // 1) Borrar TODAS las transacciones existentes del cliente
      logs.push(
        prisma.travelPointsDestination.deleteMany({
          where: {
            travelPoints: {
              toClientId: params.id,
            },
          },
        }),
      );

      logs.push(
        prisma.travelPointsTransaction.deleteMany({
          where: { toClientId: params.id },
        }),
      );

      // 2) Registrar el reset total como un log (si querés seguir teniendo historial)
      logs.push(
        prisma.travelPointsTransaction.create({
          data: {
            type: "ADJUSTMENT",
            amount: 0,
            toClientId: params.id,
            validFrom: null,
            expiresAt: new Date(),
            note: `RESET TOTAL por admin`,
          },
        }),
      );
    }

    if (addTravelPoints > 0) {
      const expiresAt =
        expiresAtExplicit ??
        calculateExpiresAt({ days: durationDays, months: durationMonths });

      logs.push(
        prisma.travelPointsTransaction.create({
          data: {
            type: "ADMIN_GRANT",
            amount: addTravelPoints,
            toClientId: params.id,
            validFrom: validFrom ?? new Date(),
            expiresAt,
            note: `Admin otorgó ${addTravelPoints} puntos`,
            destinations: {
              create: destinationIds.map((destinationId) => ({
                destinationId,
              })),
            },
          },
        }),
      );
    }

    if (logs.length) await Promise.all(logs);

    return NextResponse.json({ client: updatedClient, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo actualizar" },
      { status: 400 },
    );
  }
}
