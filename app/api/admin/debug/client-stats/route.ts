// app/api/admin/debug/client-stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Usuarios con rol USER (activos/inactivos)
  const totalUsers = await prisma.user.count({ where: { role: "USER" } });

  // Clients totales
  const totalClients = await prisma.client.count();

  // Users USER sin Client 1:1
  const missingClients = await prisma.user.count({
    where: { role: "USER", clientProfile: null },
  });

  // Clients sin seller asignado (si sellerId es opcional)
  const clientsNoSeller = await prisma.client.count({
    where: { sellerId: null },
  });

  return NextResponse.json({
    totalUsers,
    totalClients,
    missingClients,
    clientsNoSeller,
  });
}
