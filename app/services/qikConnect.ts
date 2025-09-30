import { prisma } from "../lib/prisma";
import { formattedName } from "@/app/types/business";

/**
 * Guarda el sessionId de un negocio usando Prisma.
 * @param businessId string - el ID del negocio
 * @param sessionId string - el sessionId a guardar
 */
export const saveSessionId = async (businessId: string, sessionId: string) => {
  try {
    await prisma.business.update({
      where: { id: formattedName(businessId) },
      data: { sessionId },
    });
    console.log("SessionId added to NeonDB (via Prisma)");
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
};