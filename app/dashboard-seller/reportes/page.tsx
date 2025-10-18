import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { TaskStatus } from "@prisma/client";

type SP = { [k: string]: string | string[] | undefined };

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
  if (!auth.businessId) redirect("/unauthorized");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const sellerId = auth.userId!;

  const type = str(searchParams.type, "reservas"); // reservas | destinos | productividad
  const from = str(searchParams.from);
  const to = str(searchParams.to);
  const { start, end } = parseRange(from, to);

  // ====== WHEREs base (scoped al vendedor) ======
  const baseReservationWhere: any = {
    businessId,
    sellerId, // << solo mis reservas
    startDate: { gte: start, lte: end },
  };
  const baseTaskCreatedWhere: any = {
    businessId,
    sellerId, // << solo mis tareas
    createdAt: { gte: start, lte: end },
  };
  const baseTaskDoneWhere: any = {
    businessId,
    sellerId, // << solo mis tareas
    status: "DONE",
    updatedAt: { gte: start, lte: end },
  };

  let content: React.ReactNode = null;

  /* ============================
   *      Reporte: RESERVAS
   * ============================ */
  if (type === "reservas") {
    const [byStatus, totals, byCurrency] = await Promise.all([
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["status"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.reservation.aggregate({
        where: baseReservationWhere,
        _count: { _all: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["currency"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    // Conversión aproximada de embudo
    const asMap = new Map(byStatus.map((r) => [r.status, r]));
    const leads =
      (asMap.get("LEAD")?._count._all ?? 0) +
      (asMap.get("QUOTED")?._count._all ?? 0) +
      (asMap.get("HOLD")?._count._all ?? 0);
    const wins =
      (asMap.get("CONFIRMED")?._count._all ?? 0) +
      (asMap.get("COMPLETED")?._count._all ?? 0);
    const cancels = asMap.get("CANCELED")?._count._all ?? 0;
    const expired = asMap.get("EXPIRED")?._count._all ?? 0;
    const conversion = leads > 0 ? Math.round((wins / leads) * 100) : 0;

    content = (
      <>
        {/* KPIs por estado (mi embudo) */}
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8 mb-4">
          {RES_ORDER.map((s) => {
            const row = byStatus.find((r) => r.status === s);
            const count = row?._count._all ?? 0;
            const sum = Number(row?._sum.totalAmount || 0);
            return (
              <div key={s} className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-500">{RES_LABELS[s]}</div>
                <div className="text-xl font-semibold">{count}</div>
                <div className="text-xs text-gray-500">
                  {sum ? money(sum) : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totales y métricas clave */}
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} →{" "}
            {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Total reservas</div>
              <div className="text-lg font-semibold">{totals._count._all}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Ingresos totales</div>
              <div className="text-lg font-semibold">
                {money(Number(totals._sum.totalAmount || 0))}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Ticket promedio</div>
              <div className="text-lg font-semibold">
                {money(Number(totals._avg.totalAmount || 0))}
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
      where: { businessId, id: { in: destIds } },
      select: { id: true, name: true, country: true, category: true },
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
                  <th className="px-2 py-2">Categoría</th>
                  <th className="px-2 py-2">Reservas</th>
                  <th className="px-2 py-2">Ticket promedio</th>
                  <th className="px-2 py-2">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {group.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-2 py-8 text-center text-gray-400"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
                {group
                  .sort(
                    (a, b) =>
                      Number(b._sum.totalAmount || 0) -
                      Number(a._sum.totalAmount || 0)
                  )
                  .map((g) => {
                    const d = destMap.get(g.destinationId as string);
                    return (
                      <tr key={g.destinationId || "none"} className="border-t">
                        <td className="px-2 py-2">
                          {d?.name ? (
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
                        <td className="px-2 py-2">{d?.country || "—"}</td>
                        <td className="px-2 py-2">{d?.category || "—"}</td>
                        <td className="px-2 py-2">{g._count._all}</td>
                        <td className="px-2 py-2">
                          {money(Number(g._avg.totalAmount || 0))}
                        </td>
                        <td className="px-2 py-2">
                          {money(Number(g._sum.totalAmount || 0))}
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

  /* ============================
   *   Reporte: PRODUCTIVIDAD
   * ============================ */
  if (type === "productividad") {
    // Para seller, mostramos sus propias métricas
    const [createdCount, doneCount, byStatus] = await Promise.all([
      prisma.task.count({ where: baseTaskCreatedWhere }),
      prisma.task.count({ where: baseTaskDoneWhere }),
      prisma.task.groupBy({
        where: { businessId, sellerId, updatedAt: { gte: start, lte: end } },
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
