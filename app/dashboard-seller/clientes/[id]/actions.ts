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

  // Tomar valores (URLs) de los campos del form
  const payload: Partial<Record<DocKeys, string | null>> = {
    purchaseOrder: (formData.get("purchaseOrder") as string) || null,
    flightTickets: (formData.get("flightTickets") as string) || null,
    serviceVoucher: (formData.get("serviceVoucher") as string) || null,
    medicalAssistanceCard: (formData.get("medicalAssistanceCard") as string) || null,
    travelTips: (formData.get("travelTips") as string) || null,
  };

  await prisma.user.update({
    where: { id: client.userId },
    data: payload,
  });

  // Refresca la página de detalle del cliente del seller
  revalidatePath(`/dashboard-seller/clientes/${clientId}`);
  return { ok: true };
}
