import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // Evita crear múltiples instancias en desarrollo
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient();

if (process.env.NODE_ENV === "development") global.__prisma = prisma;

// ✅ Exportás también Prisma para acceder a enums como DocumentType
export { Prisma };

export default prisma;
