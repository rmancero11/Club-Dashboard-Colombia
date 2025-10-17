"use server";

import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";

type DocKeys =
  | "purchaseOrder"
  | "flightTickets"
  | "serviceVoucher"
  | "medicalAssistanceCard"
  | "travelTips"
// Si luego tu formulario soporta identidad, descomenta y listo:
// | "dniFile"
// | "passport"
// | "visa"
;

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
  if (!auth.businessId) throw new Error("Sin empresa asociada");

  const clientId = String(formData.get("clientId") || "");
  if (!clientId) throw new Error("Falta clientId");

  // Restringe por tenant y, si no es admin, por pertenencia al seller
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      businessId: auth.businessId,
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

  // No hacer update vacío: evita touch innecesario
  if (Object.keys(payload).length === 0) {
    return { ok: true, message: "Sin cambios" };
  }

  await prisma.user.update({
    where: { id: client.userId },
    data: payload,
  });

  // Refresca la página de detalle del cliente del seller
  revalidatePath(`/dashboard-seller/clientes/${clientId}`);
  return { ok: true };
}
