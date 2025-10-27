import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { pickSellerWeighted } from "@/app/lib/assignSeller";

export const dynamic = "force-dynamic";

// ⚠️ Protege esto en producción (e.g., con middleware + rol ADMIN).
export async function POST() {
  // Trae todos los USER sin Client 1:1
  const users = await prisma.user.findMany({
    where: { role: "USER", clientProfile: null },
    select: { id: true, email: true, name: true, phone: true, country: true },
  });

  let created = 0;
  for (const u of users) {
    await prisma.$transaction(async (tx) => {
      const sellerId = await pickSellerWeighted(tx); // puede ser null si tu schema permite sellerId opcional

      const client = await tx.client.create({
        data: {
          userId: u.id,
          sellerId: sellerId ?? null,          // si sellerId es opcional en schema
          name: u.name || u.email,
          email: u.email,
          phone: u.phone ?? null,
          country: u.country ?? null,
          city: null,
          notes: null,
          tags: [],
          isArchived: false,
        },
      });

      await tx.activityLog.create({
        data: {
          action: "LEAD_ASSIGNED",
          message: `Backfill: client creado y asignado`,
          userId: u.id,
          clientId: client.id,
          metadata: { sellerId: sellerId ?? null, auto: true, backfill: true },
        },
      });
    });
    created++;
  }

  // Resumen final
  const totals = await prisma.$transaction([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.client.count(),
    prisma.client.count({ where: { sellerId: null } }),
  ]);

  return NextResponse.json({
    created,
    totals: {
      usersUSER: totals[0],
      clients: totals[1],
      clientsNoSeller: totals[2],
    },
  });
}
