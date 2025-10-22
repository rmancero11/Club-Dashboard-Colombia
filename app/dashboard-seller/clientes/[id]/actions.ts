"use server";

import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";

type DocKeys =
  | "purchaseOrder"
  | "flightTickets"
  | "serviceVoucher"
  | "medicalAssistanceCard"
  | "travelTips";
// Si luego tu formulario soporta identidad, descomenta y listo:
// | "dniFile"
// | "passport"
// | "visa"

const ALLOWED_DOC_KEYS: DocKeys[] = [
  "purchaseOrder",
  "flightTickets",
  "serviceVoucher",
  "medicalAssistanceCard",
  "travelTips",
  // "dniFile",
  // "passport",
  // "visa",
];

export async function updateClientDocumentsAction(formData: FormData) {
  const auth = await getAuth();
  if (!auth) throw new Error("No autenticado");
  if (auth.role !== "SELLER" && auth.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) throw new Error("Falta clientId");

  // Restringe por pertenencia al seller (si no es ADMIN)
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(auth.role !== "ADMIN" ? { sellerId: auth.userId } : {}),
    },
    select: { id: true, userId: true },
  });
  if (!client) throw new Error("Cliente no encontrado o sin permisos");

  // Construir payload solo con keys permitidas
  const payload: Partial<Record<DocKeys, string | null>> = {};
  for (const k of ALLOWED_DOC_KEYS) {
    const raw = formData.get(k);
    if (typeof raw === "string") {
      const url = raw.trim();
      payload[k] = url.length > 0 ? url : null;
    }
  }

  // Evita update vacío
  if (Object.keys(payload).length === 0) {
    return { ok: true, message: "Sin cambios" as const };
  }

  await prisma.user.update({
    where: { id: client.userId },
    data: payload,
  });

  // Refresca detalle del cliente
  revalidatePath(`/dashboard-seller/clientes/${clientId}`);
  return { ok: true as const };
}
