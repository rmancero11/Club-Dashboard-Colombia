import { Prisma, PrismaClient } from "@prisma/client";


type TxLike = PrismaClient | Prisma.TransactionClient;


export async function pickSellerWeighted(prisma: TxLike): Promise<string | null> {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER", status: "ACTIVE", autoAssignable: true },
    select: { id: true, assignmentWeight: true, maxActiveClients: true },
  });

  if (sellers.length === 0) {
    const fallback =
      process.env.SELLER_DEFAULT_ID ||
      (await prisma.user.findFirst({
        where: { role: "SELLER", status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })?.then((s) => s?.id));
    return fallback || null;
  }

  // carga actual (clientes no archivados por seller)
  const counts = await prisma.client.groupBy({
    by: ["sellerId"],
    where: { isArchived: false, sellerId: { in: sellers.map((s) => s.id) } },
    _count: { sellerId: true },
  });

  const loadMap = new Map<string, number>();
  for (const c of counts) {
    if (c.sellerId) loadMap.set(c.sellerId, c._count.sellerId);
  }

  // respetar capacidad si maxActiveClients existe
  const eligible = sellers.filter((s) => {
    if (!s.maxActiveClients) return true;
    const current = loadMap.get(s.id) ?? 0;
    return current < s.maxActiveClients;
  });

  const pool = (eligible.length ? eligible : sellers).map((s) => ({
    id: s.id,
    w: Math.max(1, s.assignmentWeight || 1),
  }));

  const total = pool.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const s of pool) {
    r -= s.w;
    if (r <= 0) return s.id;
  }
  return pool[pool.length - 1].id;
}
