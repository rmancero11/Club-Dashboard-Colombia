const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    UPDATE "TravelPointsTransaction"
    SET "validFrom" = "createdAt"
    WHERE "validFrom" IS NULL;
  `);

  console.log("✅ Backfill completado: validFrom = createdAt");
}

main()
  .catch((e) => {
    console.error("❌ Error en backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
