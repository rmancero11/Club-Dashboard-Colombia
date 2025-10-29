import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

function csvLine(arr: (string | number)[]) {
  return arr
    .map((v) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

function parseDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d as any) ? null : d;
}

export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "reservas";
  const now = new Date();
  const from =
    parseDate(url.searchParams.get("from")) ||
    new Date(now.getFullYear(), now.getMonth(), 1);
  const to =
    parseDate(url.searchParams.get("to")) ||
    new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const sellerId = url.searchParams.get("sellerId") || undefined;

  let csv = "";
  const filename = `reporte_${type}_${from
    .toISOString()
    .slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`;

  // =========================
  // === Reporte: Reservas ===
  // =========================
  if (type === "reservas") {
    const where: any = { startDate: { gte: from, lte: to } };
    if (sellerId) where.sellerId = sellerId;

    const [rows, sellers] = await Promise.all([
      prisma.reservation.groupBy({
        where,
        by: ["sellerId"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.user.findMany({
        where: { role: "SELLER" },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const smap = new Map(sellers.map((s) => [s.id, s.name || s.email || "—"]));

    csv += csvLine(["Vendedor", "Reservas", "Monto total (USD)"]) + "\n";
    for (const r of rows) {
      csv +=
        csvLine([
          smap.get(r.sellerId as string) || "—",
          r._count._all,
          Number(r._sum.totalAmount || 0).toFixed(2),
        ]) + "\n";
    }
  }

  // ==========================
  // === Reporte: Destinos ===
  // ==========================
  else if (type === "destinos") {
    const where: any = { startDate: { gte: from, lte: to } };
    if (sellerId) where.sellerId = sellerId;

    const groups = await prisma.reservation.groupBy({
      where,
      by: ["destinationId"],
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    const ids = groups.map((g) => g.destinationId).filter(Boolean) as string[];
    const destinations = await prisma.destination.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        membership: true,
        categories: { select: { name: true } },
      },
    });

    const dmap = new Map(destinations.map((d) => [d.id, d]));

    csv +=
      csvLine([
        "Destino",
        "País",
        "Ciudad",
        "Categorías",
        "Membresía",
        "Reservas",
        "Monto total (USD)",
      ]) + "\n";

    for (const g of groups) {
      const d = dmap.get(g.destinationId as string);
      const cats = d?.categories.map((c) => c.name).join(" | ") || "—";
      csv +=
        csvLine([
          d?.name || "—",
          d?.country || "—",
          d?.city || "—",
          cats,
          d?.membership || "—",
          g._count._all,
          Number(g._sum.totalAmount || 0).toFixed(2),
        ]) + "\n";
    }
  }

  // ===============================
  // === Reporte: Productividad ====
  // ===============================
  else if (type === "productividad") {
    const createdWhere: any = { createdAt: { gte: from, lte: to } };
    const doneWhere: any = { status: "DONE", updatedAt: { gte: from, lte: to } };
    if (sellerId) {
      createdWhere.sellerId = sellerId;
      doneWhere.sellerId = sellerId;
    }

    const [created, done, sellers] = await Promise.all([
      prisma.task.groupBy({
        where: createdWhere,
        by: ["sellerId"],
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        where: doneWhere,
        by: ["sellerId"],
        _count: { _all: true },
      }),
      prisma.user.findMany({
        where: { role: "SELLER" },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const smap = new Map(sellers.map((s) => [s.id, s.name || s.email || "—"]));
    const cr = new Map(created.map((r) => [r.sellerId, r._count._all]));
    const dn = new Map(done.map((r) => [r.sellerId, r._count._all]));

    csv += csvLine(["Vendedor", "Tareas creadas", "Completadas", "Tasa %"]) + "\n";
    for (const s of sellers) {
      const c = cr.get(s.id) || 0;
      const d = dn.get(s.id) || 0;
      const rate = c > 0 ? Math.round((d / c) * 100) : 0;
      csv += csvLine([smap.get(s.id)!, c, d, rate]) + "\n";
    }
  }

  // ==========================
  // === Type inválido ========
  // ==========================
  else {
    return new Response(JSON.stringify({ error: "type inválido" }), {
      status: 400,
    });
  }

  // ==========================
  // === Respuesta CSV ========
  // ==========================
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
