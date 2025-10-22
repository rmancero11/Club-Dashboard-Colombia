import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

type ReportType = "reservas" | "destinos" | "productividad";

function monthStartEnd(yyyyMM?: string): { start: Date; end: Date } {
  const now = new Date();
  const [y, m] =
    (yyyyMM ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-");
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1;
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function csvEscape(v: unknown) {
  if (v == null) return "";
  const s = String(v);
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCSV(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isAdmin = auth.role === "ADMIN";
  const sellerId = auth.userId;

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") as ReportType) || "reservas";
  const month = searchParams.get("month") || undefined;
  const { start, end } = monthStartEnd(month);

  /* ============== RESERVAS ============== */
  if (type === "reservas") {
    const rows = await prisma.reservation.groupBy({
      where: {
        ...(isAdmin ? {} : { sellerId }),
        startDate: { gte: start, lte: end },
      },
      by: ["status"],
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    const mapped = rows.map((r) => ({
      status: r.status,
      count: r._count._all,
      total_usd: Number(r._sum.totalAmount || 0).toFixed(2),
    }));

    const csv = toCSV(mapped);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report_reservas_${month || "actual"}.csv"`,
      },
    });
  }

  /* ============== DESTINOS (Top) ============== */
  if (type === "destinos") {
    // 1) Agrupar reservas por destino
    const grouped = await prisma.reservation.groupBy({
      where: {
        ...(isAdmin ? {} : { sellerId }),
        startDate: { gte: start, lte: end },
      },
      by: ["destinationId"],
      _count: { _all: true },
    });

    if (grouped.length === 0) {
      const csv = toCSV([]);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="report_destinos_${month || "actual"}.csv"`,
        },
      });
    }

    // 2) Traer nombres de destinos
    const destIds = grouped.map((g) => g.destinationId).filter(Boolean) as string[];
    const destinations = await prisma.destination.findMany({
      where: { id: { in: destIds } },
      select: { id: true, name: true },
    });
    const dmap = new Map(destinations.map((d) => [d.id, d.name]));

    // 3) Mapear, ordenar y limitar top 100
    const mapped = grouped
      .map((g) => ({
        destination: dmap.get(g.destinationId) || "—",
        reservations: g._count._all,
      }))
      .sort((a, b) => b.reservations - a.reservations)
      .slice(0, 100);

    const csv = toCSV(mapped);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report_destinos_${month || "actual"}.csv"`,
      },
    });
  }

  /* ============== PRODUCTIVIDAD (Tareas) ============== */
  if (type === "productividad") {
    const rows = await prisma.task.groupBy({
      where: {
        ...(isAdmin ? {} : { sellerId }),
        createdAt: { gte: start, lte: end },
      },
      by: ["status"],
      _count: { _all: true },
    });

    const mapped = rows.map((r) => ({ status: r.status, tasks: r._count._all }));
    const csv = toCSV(mapped);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report_productividad_${month || "actual"}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Tipo de reporte no soportado" }, { status: 400 });
}
