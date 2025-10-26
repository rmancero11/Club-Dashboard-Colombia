import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { TaskStatus } from "@prisma/client";

type SP = { [k: string]: string | string[] | undefined };

/** === FX helpers ===
 * Define cuántas unidades de la moneda hay por 1 USD.
 * Ej: si 1 USD = 4000 COP => FX_PER_USD.COP = 4000
 * Configurable por env: process.env.FX_COP_PER_USD
 */
const FX_PER_USD: Record<string, number> = {
  USD: 1,
  COP: Number(process.env.FX_COP_PER_USD ?? "4000"),
};

function toUSD(amount: number, currency?: string | null) {
  const cur = (currency || "USD").toUpperCase();
  const perUsd = FX_PER_USD[cur];
  if (!Number.isFinite(amount)) return 0;
  if (!perUsd || cur === "USD") return amount; // fallback: USD o moneda desconocida => no convertir
  return amount / perUsd;
}

/* =============== Helpers =============== */
function str(v: string | string[] | undefined, def = "") {
  return (Array.isArray(v) ? v[0] : v) ?? def;
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
    const val = Number.isFinite(n) ? Number(n).toFixed(2) : String(n);
    return `${currency} ${val}`;
  }
}

/** UI en español para ReservationStatus */
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

export default async function SellerReportsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const sellerId = auth.userId!;

  const type = str(searchParams.type, "reservas"); // reservas | destinos | productividad
  const from = str(searchParams.from);
  const to = str(searchParams.to);
  const { start, end } = parseRange(from, to);

  // ====== WHEREs base (scoped al vendedor) ======
  const baseReservationWhere: any = {
    sellerId, // << solo mis reservas
    startDate: { gte: start, lte: end },
  };
  const baseTaskCreatedWhere: any = {
    sellerId, // << solo mis tareas
    createdAt: { gte: start, lte: end },
  };
  const baseTaskDoneWhere: any = {
    sellerId, // << solo mis tareas
    status: "DONE",
    updatedAt: { gte: start, lte: end },
  };

  let content: React.ReactNode = null;
  /* ============================
   *      Reporte: RESERVAS
   * ============================ */
  if (type === "reservas") {
    // Agrupamos por status+currency para poder convertir bien a USD
    const [byStatusCurrency, totalCount, byCurrency] = await Promise.all([
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["status", "currency"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.reservation.count({ where: baseReservationWhere }),
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["currency"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    // Map de status => { count, sumUsd }
    const statusAgg = new Map<string, { count: number; sumUsd: number }>();

    for (const row of byStatusCurrency) {
      const prev = statusAgg.get(row.status) || { count: 0, sumUsd: 0 };
      const sumNative = Number(row._sum.totalAmount || 0);
      const sumUsd = toUSD(sumNative, row.currency);
      statusAgg.set(row.status, {
        count: prev.count + (row._count._all || 0),
        sumUsd: prev.sumUsd + sumUsd,
      });
    }

    // Conversión de embudo (solo conteos)
    const leads =
      (statusAgg.get("LEAD")?.count ?? 0) +
      (statusAgg.get("QUOTED")?.count ?? 0) +
      (statusAgg.get("HOLD")?.count ?? 0);
    const wins =
      (statusAgg.get("CONFIRMED")?.count ?? 0) +
      (statusAgg.get("COMPLETED")?.count ?? 0);
    const cancels = statusAgg.get("CANCELED")?.count ?? 0;
    const expired = statusAgg.get("EXPIRED")?.count ?? 0;
    const conversion = leads > 0 ? Math.round((wins / leads) * 100) : 0;

    // Totales USD (sumando por currency -> USD)
    const totalUsd = byCurrency.reduce((acc, r) => {
      const sumNative = Number(r._sum.totalAmount || 0);
      return acc + toUSD(sumNative, r.currency);
    }, 0);
    const avgUsd = totalCount > 0 ? totalUsd / totalCount : 0;

    content = (
      <>
        {/* KPIs por estado (en USD y conteo) */}
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8 mb-4">
          {RES_ORDER.map((s) => {
            const row = statusAgg.get(s) || { count: 0, sumUsd: 0 };
            return (
              <div key={s} className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-500">{RES_LABELS[s]}</div>
                <div className="text-xl font-semibold">{row.count}</div>
                <div className="text-xs text-gray-500">
                  {row.sumUsd ? money(row.sumUsd, "USD") : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totales y métricas clave (en USD) */}
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
                {money(Number(totalUsd || 0), "USD")}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Ticket promedio (USD)</div>
              <div className="text-lg font-semibold">
                {money(Number(avgUsd || 0), "USD")}
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

        {/* Ingresos por moneda (tabla original, se mantiene) */}
        <div className="rounded-xl border bg-white p-4 mb-4">
          <h3 className="mb-2 text-lg font-semibold">Ingresos por moneda</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Moneda</th>
                  <th className="px-2 py-2">Reservas</th>
                  <th className="px-2 py-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {byCurrency.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {byCurrency
                  .slice()
                  .sort(
                    (a, b) =>
                      Number(b._sum.totalAmount || 0) -
                      Number(a._sum.totalAmount || 0)
                  )
                  .map((r) => (
                    <tr key={r.currency || "none"} className="border-t">
                      <td className="px-2 py-2">{r.currency || "—"}</td>
                      <td className="px-2 py-2">{r._count._all}</td>
                      <td className="px-2 py-2">
                        {money(
                          Number(r._sum.totalAmount || 0),
                          r.currency || "USD"
                        )}
                      </td>
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
      </>
    );
  }

  /* ============================
   *      Reporte: DESTINOS
   * ============================ */
  if (type === "destinos") {
    const [group, total] = await Promise.all([
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["destinationId"],
        _count: { _all: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      prisma.reservation.aggregate({
        where: baseReservationWhere,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const destIds = group
      .map((g) => g.destinationId)
      .filter(Boolean) as string[];
    const destinations = await prisma.destination.findMany({
      where: { id: { in: destIds } },
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        membership: true,
        categories: { select: { name: true } },
      },
    });
    const destMap = new Map(destinations.map((d) => [d.id, d]));

    content = (
      <>
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} →{" "}
            {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-1 text-xl font-semibold">
            Mis reservas: {total._count._all} ·{" "}
            {money(Number(total._sum.totalAmount || 0))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold">
            Top destinos (mis ventas)
          </h3>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Destino</th>
                  <th className="px-2 py-2">Ubicación</th>
                  <th className="px-2 py-2">Categorías</th>
                  <th className="px-2 py-2">Membresía</th>
                  <th className="px-2 py-2">Reservas</th>
                  <th className="px-2 py-2">Ticket promedio</th>
                  <th className="px-2 py-2">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {group.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                ) : (
                  group
                    .sort(
                      (a, b) =>
                        Number(b._sum.totalAmount || 0) -
                        Number(a._sum.totalAmount || 0)
                    )
                    .map((g) => {
                      const d = destMap.get(g.destinationId as string);
                      return (
                        <tr
                          key={g.destinationId || "none"}
                          className="border-t"
                        >
                          <td className="px-2 py-2">
                            {d ? (
                              <a
                                className="underline"
                                href={`/dashboard-seller/destinos/${d.id}`}
                              >
                                {d.name}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {[d?.city, d?.country].filter(Boolean).join(", ") ||
                              d?.country ||
                              "—"}
                          </td>
                          <td className="px-2 py-2">
                            {d?.categories.map((c) => c.name).join(", ") || "—"}
                          </td>
                          <td className="px-2 py-2">{d?.membership || "—"}</td>
                          <td className="px-2 py-2">{g._count._all}</td>
                          <td className="px-2 py-2">
                            {money(Number(g._avg.totalAmount || 0))}
                          </td>
                          <td className="px-2 py-2">
                            {money(Number(g._sum.totalAmount || 0))}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  /* ============================
   *   Reporte: PRODUCTIVIDAD
   * ============================ */
  if (type === "productividad") {
    // Para seller, mostramos sus propias métricas
    const [createdCount, doneCount, byStatus] = await Promise.all([
      prisma.task.count({ where: baseTaskCreatedWhere }),
      prisma.task.count({ where: baseTaskDoneWhere }),
      prisma.task.groupBy({
        where: { sellerId, updatedAt: { gte: start, lte: end } },
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const statusMap = new Map(byStatus.map((r) => [r.status, r._count._all]));
    const rate =
      createdCount > 0 ? Math.round((doneCount / createdCount) * 100) : 0;

    const STATUSES: TaskStatus[] = [
      "OPEN",
      "IN_PROGRESS",
      "BLOCKED",
      "DONE",
      "CANCELLED",
    ];

    content = (
      <>
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} →{" "}
            {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Tareas creadas</div>
              <div className="text-lg font-semibold">{createdCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Tareas completadas</div>
              <div className="text-lg font-semibold">{doneCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Tasa de cierre</div>
              <div className="text-lg font-semibold">{rate}%</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">
                Bloqueadas (actualizadas en rango)
              </div>
              <div className="text-lg font-semibold">
                {statusMap.get("BLOCKED") || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold">
            Detalle por estado (actualizadas en rango)
          </h3>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {STATUSES.map((s) => (
                  <tr key={s} className="border-t">
                    <td className="px-2 py-2">{s}</td>
                    <td className="px-2 py-2">{statusMap.get(s) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500">Tus métricas y resultados.</p>
      </header>

      {/* Filtros (sin selector de vendedor) */}
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
            defaultValue={new Date(start).toISOString().slice(0, 10)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="to"
            defaultValue={new Date(end).toISOString().slice(0, 10)}
            className="rounded-md border px-3 py-2 text-sm"
          />

          <button className="rounded-md border px-3 py-2 text-sm" type="submit">
            Aplicar
          </button>
          <a
            href={`/dashboard-seller/reportes`}
            className="rounded-md border px-3 py-2 text-sm"
            title="Borrar filtros"
          >
            Borrar filtros
          </a>
        </form>

        {/* Contenido */}
        <div className="space-y-4">{content}</div>
      </div>
    </div>
  );
}
