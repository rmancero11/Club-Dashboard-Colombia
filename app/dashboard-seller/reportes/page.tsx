import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Prisma } from '@prisma/client';

type ReportType = "reservas" | "destinos" | "productividad";

function monthStartEnd(yyyyMM?: string): { start: Date; end: Date } {
  const now = new Date();
  const [y, m] = (yyyyMM || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-");
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1; // 0-based
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function qs(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && usp.set(k, v));
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.businessId) redirect("/unauthorized");

  const isAdmin = auth.role === "ADMIN";
  const businessId = auth.businessId!;
  const sellerId = auth.userId;
  const sellerClause = isAdmin
    ? Prisma.empty
    : Prisma.sql`AND r."sellerid" = ${sellerId}`;

  const type = (Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type) as ReportType | undefined;
  const month = (Array.isArray(searchParams.month) ? searchParams.month[0] : searchParams.month) || undefined;
  const safeType: ReportType = type && ["reservas", "destinos", "productividad"].includes(type) ? type : "reservas";
  const { start, end } = monthStartEnd(month);

  // Construye link de export CSV con los mismos filtros
  const exportHref = `/dashboard-seller/reportes/export${qs({ type: safeType, month })}`;

  let content: React.ReactNode = null;

  if (safeType === "reservas") {
    // Group by status con suma de totalAmount
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

    const totalCount = rows.reduce((acc, r) => acc + r._count._all, 0);
    const totalAmount = rows.reduce((acc, r) => acc + Number(r._sum.totalAmount || 0), 0);

    content = (
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Reservas</th>
              <th className="px-2 py-2">Total (USD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-2 py-10 text-center text-gray-400">Sin datos</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.status} className="border-t">
                <td className="px-2 py-2">{r.status}</td>
                <td className="px-2 py-2">{r._count._all}</td>
                <td className="px-2 py-2">{Number(r._sum.totalAmount || 0).toLocaleString("es-CO", { style: "currency", currency: "USD" })}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="border-t font-medium">
                <td className="px-2 py-2">Total</td>
                <td className="px-2 py-2">{totalCount}</td>
                <td className="px-2 py-2">{totalAmount.toLocaleString("es-CO", { style: "currency", currency: "USD" })}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (safeType === "destinos") {
    // Top destinos por número de reservas
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
      LIMIT 10
    `;

    content = (
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Destino</th>
              <th className="px-2 py-2">Reservas</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={2} className="px-2 py-10 text-center text-gray-400">Sin datos</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="px-2 py-2">{r.name}</td>
                <td className="px-2 py-2">{Number(r.cnt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (safeType === "productividad") {
    // Tareas por estado creadas en el mes
    const rows = await prisma.task.groupBy({
      where: {
        businessId,
        ...(isAdmin ? {} : { sellerId }),
        createdAt: { gte: start, lte: end },
      },
      by: ["status"],
      _count: { _all: true },
    });

    const total = rows.reduce((acc, r) => acc + r._count._all, 0);

    content = (
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Tareas</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={2} className="px-2 py-10 text-center text-gray-400">Sin datos</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.status} className="border-t">
                <td className="px-2 py-2">{r.status}</td>
                <td className="px-2 py-2">{r._count._all}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="border-t font-medium">
                <td className="px-2 py-2">Total</td>
                <td className="px-2 py-2">{total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // UI
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500">Análisis y exportaciones.</p>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <form method="GET" className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select name="type" defaultValue={safeType} className="rounded-md border px-3 py-2 text-sm">
            <option value="reservas">Reservas por estado</option>
            <option value="destinos">Top destinos</option>
            <option value="productividad">Productividad (tareas)</option>
          </select>
          <input
            type="month"
            name="month"
            defaultValue={month || defaultMonth}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">Aplicar</button>
            <a
              href={exportHref}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Exportar CSV
            </a>
          </div>
        </form>

        {content || <div className="h-64 grid place-items-center text-gray-400">Sin datos</div>}
      </div>
    </div>
  );
}
