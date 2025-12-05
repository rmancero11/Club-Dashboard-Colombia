const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.travelPointsTransaction.updateMany({
    where: {
      expiresAt: null,
    },
    data: {
      expiresAt: new Date("2026-01-01"), // ✅ podés cambiar esta fecha
    },
  });

  console.log("Registros actualizados:", result.count);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
