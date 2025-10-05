import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { Prisma } from '@prisma/client';

type ReportType = "reservas" | "destinos" | "productividad";

function monthStartEnd(yyyyMM?: string): { start: Date; end: Date } {
  const now = new Date();
  const [y, m] = (yyyyMM || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-");
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
  if (!auth || !auth.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const isAdmin = auth.role === "ADMIN";
  const businessId = auth.businessId!;
  const sellerId = auth.userId;

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") as ReportType) || "reservas";
  const month = searchParams.get("month") || undefined;
  const { start, end } = monthStartEnd(month);

  if (type === "reservas") {
    const rows = await prisma.reservation.groupBy({
      where: {
        businessId,
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

  if (type === "destinos") {
    const sellerClause = isAdmin
      ? Prisma.empty
      : Prisma.sql`AND r."sellerid" = ${sellerId}`

    const rows = await prisma.$queryRaw<{ name: string; cnt: bigint }[]>`
      SELECT d."name" AS name, COUNT(r.*)::bigint AS cnt
      FROM "Reservation" r
      JOIN "Destination" d ON d."id" = r."destinationId"
      WHERE r."businessId" = ${businessId}
        ${sellerClause}
        AND r."startDate" >= ${start}
        AND r."startDate" <= ${end}
      GROUP BY d."name"
      ORDER BY cnt DESC
      LIMIT 100
    `;
    const mapped = rows.map((r) => ({ destination: r.name, reservations: Number(r.cnt) }));
    const csv = toCSV(mapped);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report_destinos_${month || "actual"}.csv"`,
      },
    });
  }

  if (type === "productividad") {
    const rows = await prisma.task.groupBy({
      where: {
        businessId,
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
