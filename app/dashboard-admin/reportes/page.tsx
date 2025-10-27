import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

// ================= Utils =================
type SP = { [k: string]: string | string[] | undefined };

function str(v: string | string[] | undefined, def = "") {
  return (Array.isArray(v) ? v[0] : v) ?? def;
}
function qstr(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && usp.set(k, v));
  const s = usp.toString();
  return s ? `?${s}` : "";
}
function parseRange(from?: string, to?: string) {
  const now = new Date();
  const start = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to
    ? new Date(to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  if (isNaN(start as any) || isNaN(end as any)) {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return { start, end };
}
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

// =========== Conversión de moneda ===========
const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  COP: 1 / 4000, // 1 USD = 4000 COP (ajústalo a tu tasa)
  EUR: 1.1, // 1 EUR ≈ 1.1 USD (ejemplo)
};

function toUSD(amount: number, currency?: string | null) {
  if (!amount) return 0;
  const rate = CURRENCY_RATES[currency ?? "USD"] ?? 1;
  return amount * rate;
}

// Etiquetas en español para estados de reserva
const RES_LABELS: Record<string, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  HOLD: "En espera",
  CONFIRMED: "Confirmada",
  TRAVELING: "En viaje",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Vencida",
};
const RES_ORDER: Array<keyof typeof RES_LABELS> = [
  "LEAD",
  "QUOTED",
  "HOLD",
  "CONFIRMED",
  "TRAVELING",
  "COMPLETED",
  "CANCELED",
  "EXPIRED",
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const type = str(searchParams.type, "reservas"); // reservas | destinos | productividad
  const from = str(searchParams.from);
  const to = str(searchParams.to);
  const sellerId = str(searchParams.sellerId);
  const { start, end } = parseRange(from, to);

  // ============== Filtros base ==============
  const baseReservationWhere: any = { startDate: { gte: start, lte: end } };
  if (sellerId) baseReservationWhere.sellerId = sellerId;

  const baseTaskCreatedWhere: any = { createdAt: { gte: start, lte: end } };
  const baseTaskDoneWhere: any = {
    status: "DONE",
    updatedAt: { gte: start, lte: end },
  };
  if (sellerId) {
    baseTaskCreatedWhere.sellerId = sellerId;
    baseTaskDoneWhere.sellerId = sellerId;
  }

  // Lista para filtros (no usar para map de nombres en tabla)
  const sellersForFilter = await prisma.user.findMany({
    where: { role: "SELLER", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // ================= Contenido dinámico =================
  let content: React.ReactNode = null;

  // ======= Reporte: RESERVAS =======
  if (type === "reservas") {
    // Ojo: agrupamos con currency para poder convertir correctamente
    const [byStatus, bySeller, byCurrency, allReservations] = await Promise.all(
      [
        prisma.reservation.groupBy({
          where: baseReservationWhere,
          by: ["status", "currency"],
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),
        prisma.reservation.groupBy({
          where: baseReservationWhere,
          by: ["sellerId", "currency"],
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),
        prisma.reservation.groupBy({
          where: baseReservationWhere,
          by: ["currency"],
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),
        prisma.reservation.findMany({
          where: baseReservationWhere,
          select: { totalAmount: true, currency: true },
        }),
      ]
    );

    // Total USD general
    const totalUSD = allReservations.reduce(
      (acc, r) => acc + toUSD(Number(r.totalAmount || 0), r.currency),
      0
    );

    // KPIs por estado (USD)
    const statusMap = new Map<string, { count: number; sumUSD: number }>();
    for (const row of byStatus) {
      const sumUSD = toUSD(Number(row._sum.totalAmount || 0), row.currency);
      const prev = statusMap.get(row.status) || { count: 0, sumUSD: 0 };
      prev.count += row._count._all;
      prev.sumUSD += sumUSD;
      statusMap.set(row.status, prev);
    }

    const leads =
      (statusMap.get("LEAD")?.count ?? 0) +
      (statusMap.get("QUOTED")?.count ?? 0) +
      (statusMap.get("HOLD")?.count ?? 0);
    const wins =
      (statusMap.get("CONFIRMED")?.count ?? 0) +
      (statusMap.get("COMPLETED")?.count ?? 0);
    const cancels = statusMap.get("CANCELED")?.count ?? 0;
    const expired = statusMap.get("EXPIRED")?.count ?? 0;
    const conversion = leads > 0 ? Math.round((wins / leads) * 100) : 0;

    // Por vendedor (en USD)
    const sellerAgg = new Map<string, { count: number; sumUSD: number }>();
    for (const row of bySeller) {
      const id = row.sellerId ?? "none";
      const usd = toUSD(Number(row._sum.totalAmount || 0), row.currency);
      const prev = sellerAgg.get(id) || { count: 0, sumUSD: 0 };
      prev.count += row._count._all;
      prev.sumUSD += usd;
      sellerAgg.set(id, prev);
    }

    // Construir sellerMap desde los IDs reales del reporte (incluye INACTIVE)
    const sellerIdsFromData = Array.from(
      new Set(Array.from(sellerAgg.keys()).filter(Boolean))
    ) as string[];

    const sellersFromData = sellerIdsFromData.length
      ? await prisma.user.findMany({
          where: { id: { in: sellerIdsFromData } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const sellerMap = new Map<string, string>(
      sellersFromData.map((s) => [s.id, s.name?.trim() || s.email || "—"])
    );

    // Por moneda (info + USD)
    const currencyRows = byCurrency.map((r) => ({
      currency: r.currency || "USD",
      count: r._count._all,
      amountOriginal: Number(r._sum.totalAmount || 0),
      amountUSD: toUSD(Number(r._sum.totalAmount || 0), r.currency),
    }));

    const totalCount = Array.from(statusMap.values()).reduce(
      (a, b) => a + b.count,
      0
    );
    const avgTicketUSD = totalCount > 0 ? totalUSD / totalCount : 0;

    content = (
      <>
        {/* KPIs por estado */}
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8 mb-4">
          {RES_ORDER.map((s) => {
            const row = statusMap.get(s);
            return (
              <div key={s} className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-500">{RES_LABELS[s]}</div>
                <div className="text-xl font-semibold">{row?.count ?? 0}</div>
                <div className="text-xs text-gray-500">
                  {row?.sumUSD ? money(row.sumUSD, "USD") : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totales */}
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} →{" "}
            {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Total reservas</div>
              <div className="text-lg font-semibold">{totalCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">
                Ingresos totales (USD)
              </div>
              <div className="text-lg font-semibold">
                {money(totalUSD, "USD")}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Ticket promedio (USD)</div>
              <div className="text-lg font-semibold">
                {money(avgTicketUSD, "USD")}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">
                Conversión (Conf.+Compl. / Lead+Cot+Hold)
              </div>
              <div className="text-lg font-semibold">{conversion}%</div>
            </div>
          </div>
        </div>

        {/* Ingresos por moneda */}
        <div className="rounded-xl border bg-white p-4 mb-4">
          <h3 className="mb-2 text-lg font-semibold">
            Ingresos por moneda (convertidos a USD)
          </h3>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Moneda</th>
                  <th className="px-2 py-2">Reservas</th>
                  <th className="px-2 py-2">Monto original</th>
                  <th className="px-2 py-2">Monto USD</th>
                </tr>
              </thead>
              <tbody>
                {currencyRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {currencyRows
                  .sort((a, b) => b.amountUSD - a.amountUSD)
                  .map((r) => (
                    <tr key={r.currency} className="border-t">
                      <td className="px-2 py-2">{r.currency}</td>
                      <td className="px-2 py-2">{r.count}</td>
                      <td className="px-2 py-2">
                        {money(r.amountOriginal, r.currency)}
                      </td>
                      <td className="px-2 py-2">{money(r.amountUSD, "USD")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Canceladas: <span className="font-medium">{cancels}</span> ·
            Vencidas: <span className="font-medium">{expired}</span>
          </div>
        </div>

        {/* Por vendedor */}
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold">Por vendedor</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Vendedor</th>
                  <th className="px-2 py-2">Reservas</th>
                  <th className="px-2 py-2">Monto (USD)</th>
                </tr>
              </thead>
              <tbody>
                {sellerAgg.size === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {Array.from(sellerAgg.entries())
                  .sort(
                    (a, b) =>
                      b[1].sumUSD - a[1].sumUSD || b[1].count - a[1].count
                  )
                  .map(([id, r]) => (
                    <tr key={id} className="border-t">
                      <td className="px-2 py-2">{sellerMap.get(id) ?? "—"}</td>
                      <td className="px-2 py-2">{r.count}</td>
                      <td className="px-2 py-2">{money(r.sumUSD, "USD")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // ======= Reporte: DESTINOS =======
  if (type === "destinos") {
    // Agrupamos por destino y moneda para consolidar en USD
    const [group, allForAvg] = await Promise.all([
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["destinationId", "currency"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.reservation.findMany({
        where: baseReservationWhere,
        select: { destinationId: true, totalAmount: true, currency: true },
      }),
    ]);

    // Armar totales por destino en USD
    type DestAgg = { count: number; sumUSD: number };
    const destAggMap = new Map<string, DestAgg>();

    for (const g of group) {
      const id = g.destinationId as string;
      const usd = toUSD(Number(g._sum.totalAmount || 0), g.currency);
      const prev = destAggMap.get(id) || { count: 0, sumUSD: 0 };
      prev.count += g._count._all;
      prev.sumUSD += usd;
      destAggMap.set(id, prev);
    }

    const totalCount = Array.from(destAggMap.values()).reduce(
      (a, b) => a + b.count,
      0
    );
    const totalUSD = Array.from(destAggMap.values()).reduce(
      (a, b) => a + b.sumUSD,
      0
    );
    const avgTicketUSD = totalCount > 0 ? totalUSD / totalCount : 0;

    const destIds = Array.from(destAggMap.keys());
    const destinations = destIds.length
      ? await prisma.destination.findMany({
          where: { id: { in: destIds } },
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            membership: true,
            categories: { select: { name: true } },
          },
        })
      : [];
    const destMap = new Map(destinations.map((d) => [d.id, d]));

    content = (
      <>
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} →{" "}
            {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-1 text-xl font-semibold">
            Total reservas: {totalCount} · {money(totalUSD, "USD")}
          </div>
          <div className="text-sm text-gray-500">
            Ticket promedio (USD): {money(avgTicketUSD, "USD")}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold">
            Top destinos (montos en USD)
          </h3>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Destino</th>
                  <th className="px-2 py-2">País</th>
                  <th className="px-2 py-2">Ciudad</th>
                  <th className="px-2 py-2">Categorías</th>
                  <th className="px-2 py-2">Membresía</th>
                  <th className="px-2 py-2">Reservas</th>
                  <th className="px-2 py-2">Ticket promedio (USD)</th>
                  <th className="px-2 py-2">Monto total (USD)</th>
                </tr>
              </thead>
              <tbody>
                {destIds.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {destIds
                  .sort(
                    (a, b) =>
                      destAggMap.get(b)!.sumUSD - destAggMap.get(a)!.sumUSD
                  )
                  .map((id) => {
                    const d = destMap.get(id);
                    const agg = destAggMap.get(id)!;
                    const cats =
                      d?.categories.map((c) => c.name).join(" | ") || "—";
                    const avgUSD = agg.count > 0 ? agg.sumUSD / agg.count : 0;
                    return (
                      <tr key={id} className="border-t">
                        <td className="px-2 py-2">{d?.name || "—"}</td>
                        <td className="px-2 py-2">{d?.country || "—"}</td>
                        <td className="px-2 py-2">{d?.city || "—"}</td>
                        <td className="px-2 py-2">{cats}</td>
                        <td className="px-2 py-2">{d?.membership || "—"}</td>
                        <td className="px-2 py-2">{agg.count}</td>
                        <td className="px-2 py-2">{money(avgUSD, "USD")}</td>
                        <td className="px-2 py-2">
                          {money(agg.sumUSD, "USD")}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // ======= Reporte: PRODUCTIVIDAD =======
  if (type === "productividad") {
    const [created, done] = await Promise.all([
      prisma.task.groupBy({
        where: baseTaskCreatedWhere,
        by: ["sellerId"],
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        where: baseTaskDoneWhere,
        by: ["sellerId"],
        _count: { _all: true },
      }),
    ]);
    const crMap = new Map(created.map((r) => [r.sellerId, r._count._all]));
    const dnMap = new Map(done.map((r) => [r.sellerId, r._count._all]));

    // Para nombres, tomar IDs reales que aparecen en filas
    const sellerIds = Array.from(
      new Set(
        [...Array.from(crMap.keys()), ...Array.from(dnMap.keys())].filter(
          Boolean
        )
      )
    ) as string[];
    const sellersFromData = sellerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const sellerMap = new Map<string, string>(
      sellersFromData.map((s) => [s.id, s.name?.trim() || s.email || "—"])
    );

    const rows = sellerIds
      .map((id) => {
        const createdCount = crMap.get(id) || 0;
        const doneCount = dnMap.get(id) || 0;
        const rate =
          createdCount > 0 ? Math.round((doneCount / createdCount) * 100) : 0;
        return {
          id,
          name: sellerMap.get(id) ?? "—",
          created: createdCount,
          done: doneCount,
          rate,
        };
      })
      .sort((a, b) => b.rate - a.rate || b.done - a.done);

    content = (
      <>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} →{" "}
            {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-1 text-xl font-semibold">
            Productividad de tareas (creadas vs. completadas)
          </div>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Vendedor</th>
                  <th className="px-2 py-2">Creadas</th>
                  <th className="px-2 py-2">Completadas</th>
                  <th className="px-2 py-2">Tasa de cierre</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-2">{r.name}</td>
                    <td className="px-2 py-2">{r.created}</td>
                    <td className="px-2 py-2">{r.done}</td>
                    <td className="px-2 py-2">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // Exportaciones (CSV)
  const exportSummaryHref = `/api/admin/reports/export${qstr({
    type,
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    sellerId: sellerId || undefined,
    mode: "summary",
  })}`;
  const exportDetailedHref = `/api/admin/reports/export${qstr({
    type,
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    sellerId: sellerId || undefined,
    mode: "detailed",
  })}`;

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500">Análisis y exportaciones.</p>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-5">
        <form className="mb-3 flex flex-wrap items-end gap-2" method="GET">
          <select
            name="type"
            defaultValue={type}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="reservas">Reservas (embudo y ventas)</option>
            <option value="destinos">Top destinos</option>
            <option value="productividad">Productividad (tareas)</option>
          </select>

          <input
            type="date"
            name="from"
            defaultValue={start.toISOString().slice(0, 10)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="to"
            defaultValue={end.toISOString().slice(0, 10)}
            className="rounded-md border px-3 py-2 text-sm"
          />

          <select
            name="sellerId"
            defaultValue={sellerId}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Vendedor (todos)</option>
            {sellersForFilter.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input type="hidden" name="page" value="1" />
            <button
              className="rounded-md border px-3 py-2 text-sm"
              type="submit"
            >
              Aplicar
            </button>
            <a
              href={`/dashboard-admin/reportes`}
              className="rounded-md border px-3 py-2 text-sm"
              title="Borrar filtros"
            >
              Borrar filtros
            </a>
          </div>
        </form>

        {/* Botones de exportación */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <a
            href={exportSummaryHref}
            className="rounded-md border px-3 py-2 text-sm"
          >
            Exportar CSV (Resumen)
          </a>
          <a
            href={exportDetailedHref}
            className="rounded-md border px-3 py-2 text-sm"
          >
            Exportar CSV (Detallado)
          </a>
        </div>

        {/* Contenido */}
        <div className="space-y-4">{content}</div>
      </div>
    </div>
  );
}
