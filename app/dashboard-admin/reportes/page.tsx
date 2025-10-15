import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

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
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
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
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

// UI en español para ReservationStatus
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

export default async function AdminReportsPage({ searchParams }: { searchParams: SP }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const type = str(searchParams.type, "reservas"); // reservas | destinos | productividad
  const from = str(searchParams.from);
  const to = str(searchParams.to);
  const sellerId = str(searchParams.sellerId);
  const { start, end } = parseRange(from, to);

  // Filtros comunes
  const baseReservationWhere: any = { businessId, startDate: { gte: start, lte: end } };
  if (sellerId) baseReservationWhere.sellerId = sellerId;

  const baseTaskCreatedWhere: any = { businessId, createdAt: { gte: start, lte: end } };
  const baseTaskDoneWhere: any = { businessId, status: "DONE", updatedAt: { gte: start, lte: end } };
  if (sellerId) {
    baseTaskCreatedWhere.sellerId = sellerId;
    baseTaskDoneWhere.sellerId = sellerId;
  }

  // Opciones de filtro
  const sellers = await prisma.user.findMany({
    where: { businessId, role: "SELLER", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Datos por tipo
  let content: React.ReactNode = null;

  // ======= Reporte: RESERVAS =======
  if (type === "reservas") {
    const [byStatus, bySeller, totals, byCurrency] = await Promise.all([
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["status"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["sellerId"],
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

    const sellerMap = new Map(sellers.map((s) => [s.id, (s.name || s.email) ?? "—"]));

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
        {/* KPIs por estado */}
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8 mb-4">
          {RES_ORDER.map((s) => {
            const row = byStatus.find((r) => r.status === s);
            const count = row?._count._all ?? 0;
            const sum = Number(row?._sum.totalAmount || 0);
            return (
              <div key={s} className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-500">{RES_LABELS[s]}</div>
                <div className="text-xl font-semibold">{count}</div>
                <div className="text-xs text-gray-500">{sum ? money(sum) : "—"}</div>
              </div>
            );
          })}
        </div>

        {/* Totales y métricas clave */}
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} → {end.toLocaleDateString("es-CO")}
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
              <div className="text-xs text-gray-500">Conversión (Conf.+Compl. / Lead+Cot+Hold)</div>
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
                    <td colSpan={3} className="px-2 py-8 text-center text-gray-400">
                      Sin datos
                    </td>
                  </tr>
                )}
                {byCurrency
                  .sort((a, b) => Number(b._sum.totalAmount || 0) - Number(a._sum.totalAmount || 0))
                  .map((r) => (
                    <tr key={r.currency || "none"} className="border-t">
                      <td className="px-2 py-2">{r.currency || "—"}</td>
                      <td className="px-2 py-2">{r._count._all}</td>
                      <td className="px-2 py-2">
                        {money(Number(r._sum.totalAmount || 0), r.currency || "USD")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Canceladas: <span className="font-medium">{cancels}</span> · Vencidas:{" "}
            <span className="font-medium">{expired}</span>
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
                  <th className="px-2 py-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {bySeller.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-2 py-8 text-center text-gray-400">
                      Sin datos
                    </td>
                  </tr>
                )}
                {bySeller
                  .sort((a, b) => Number(b._sum.totalAmount || 0) - Number(a._sum.totalAmount || 0))
                  .map((r) => (
                    <tr key={r.sellerId || "none"} className="border-t">
                      <td className="px-2 py-2">{sellerMap.get(r.sellerId as string) || "—"}</td>
                      <td className="px-2 py-2">{r._count._all}</td>
                      <td className="px-2 py-2">{money(Number(r._sum.totalAmount || 0))}</td>
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

    const destIds = group.map((g) => g.destinationId).filter(Boolean) as string[];
    const destinations = await prisma.destination.findMany({
      where: { businessId, id: { in: destIds } },
      select: { id: true, name: true, country: true, category: true },
    });
    const destMap = new Map(destinations.map((d) => [d.id, d]));

    content = (
      <>
        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} → {end.toLocaleDateString("es-CO")}
          </div>
          <div className="mt-1 text-xl font-semibold">
            Total reservas: {total._count._all} · {money(Number(total._sum.totalAmount || 0))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold">Top destinos</h3>
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
                    <td colSpan={6} className="px-2 py-8 text-center text-gray-400">
                      Sin datos
                    </td>
                  </tr>
                )}
                {group
                  .sort((a, b) => Number(b._sum.totalAmount || 0) - Number(a._sum.totalAmount || 0))
                  .map((g) => {
                    const d = destMap.get(g.destinationId as string);
                    return (
                      <tr key={g.destinationId || "none"} className="border-t">
                        <td className="px-2 py-2">{d?.name || "—"}</td>
                        <td className="px-2 py-2">{d?.country || "—"}</td>
                        <td className="px-2 py-2">{d?.category || "—"}</td>
                        <td className="px-2 py-2">{g._count._all}</td>
                        <td className="px-2 py-2">{money(Number(g._avg.totalAmount || 0))}</td>
                        <td className="px-2 py-2">{money(Number(g._sum.totalAmount || 0))}</td>
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

  // ======= Reporte: PRODUCTIVIDAD (Tareas) =======
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

    const rows = sellers
      .map((s) => {
        const c = crMap.get(s.id) || 0;
        const d = dnMap.get(s.id) || 0;
        const rate = c > 0 ? Math.round((d / c) * 100) : 0;
        return { name: s.name || s.email || "—", created: c, done: d, rate };
      })
      .sort((a, b) => b.rate - a.rate || b.done - a.done);

    content = (
      <>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">
            Rango: {start.toLocaleDateString("es-CO")} → {end.toLocaleDateString("es-CO")}
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
                    <td colSpan={4} className="px-2 py-8 text-center text-gray-400">
                      Sin datos
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
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
          <select name="type" defaultValue={type} className="rounded-md border px-3 py-2 text-sm">
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
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>

          {/* Botones en la misma fila que los filtros */}
          <div className="flex items-center gap-2">
            <input type="hidden" name="page" value="1" />
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">
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

        {/* Botones de exportación debajo */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <a href={exportSummaryHref} className="rounded-md border px-3 py-2 text-sm">
            Exportar CSV (Resumen)
          </a>
          <a href={exportDetailedHref} className="rounded-md border px-3 py-2 text-sm">
            Exportar CSV (Detallado)
          </a>
        </div>

        {/* Contenido del reporte */}
        <div className="space-y-4">{content}</div>
      </div>
    </div>
  );
}
