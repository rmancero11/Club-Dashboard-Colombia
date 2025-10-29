import prisma from "@/app/lib/prisma";
import { pickSellerWeighted } from "@/app/lib/assignSeller";

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE", clientProfile: null },
    select: { id: true, email: true, name: true, phone: true, country: true },
  });

  let created = 0;
  for (const u of users) {
    await prisma.$transaction(async (tx) => {
      const sellerId = await pickSellerWeighted(tx);
      await tx.client.create({
        data: {
          userId: u.id,
          sellerId: sellerId ?? null, // opcional
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
          message: `Backfill: asignado automáticamente`,
          userId: u.id,
          metadata: { sellerId: sellerId ?? null, auto: true, backfill: true },
        },
      });
    });
    created++;
  }
  console.log(`Backfill listo. Creados: ${created}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
