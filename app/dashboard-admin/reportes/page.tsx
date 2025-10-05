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
  // por defecto: mes actual
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  if (isNaN(start as any) || isNaN(end as any)) {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
  }
  return { start, end };
}
function money(n: number, currency = "USD") {
  try { return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}

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

  if (type === "reservas") {
    const [byStatus, bySeller, totalAgg] = await Promise.all([
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
      }),
    ]);

    const sellerMap = new Map(
      sellers.map((s) => [s.id, (s.name || s.email) ?? "—"])
    );

    content = (
      <>
        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-5">
          {["DRAFT","PENDING","CONFIRMED","CANCELED","COMPLETED"].map((s) => {
            const row = byStatus.find((r) => r.status === (s as any));
            return (
              <div key={s} className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-500">{s}</div>
                <div className="text-xl font-semibold">{row?._count._all ?? 0}</div>
                <div className="text-xs text-gray-500">
                  {money(Number(row?._sum.totalAmount || 0))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totales */}
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Rango: {start.toLocaleDateString("es-CO")} → {end.toLocaleDateString("es-CO")}</div>
          <div className="mt-1 text-xl font-semibold">
            Total reservas: {totalAgg._count._all} · {money(Number(totalAgg._sum.totalAmount || 0))}
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
                  <tr><td colSpan={3} className="px-2 py-8 text-center text-gray-400">Sin datos</td></tr>
                )}
                {bySeller
                  .sort((a,b)=> Number(b._sum.totalAmount||0) - Number(a._sum.totalAmount||0))
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

  if (type === "destinos") {
    const [group, total] = await Promise.all([
      prisma.reservation.groupBy({
        where: baseReservationWhere,
        by: ["destinationId"],
        _count: { _all: true },
        _sum: { totalAmount: true },
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
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Rango: {start.toLocaleDateString("es-CO")} → {end.toLocaleDateString("es-CO")}</div>
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
                  <th className="px-2 py-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {group.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-8 text-center text-gray-400">Sin datos</td></tr>
                )}
                {group
                  .sort((a,b)=> Number(b._sum.totalAmount||0) - Number(a._sum.totalAmount||0))
                  .map((g) => {
                    const d = destMap.get(g.destinationId as string);
                    return (
                      <tr key={g.destinationId || "none"} className="border-t">
                        <td className="px-2 py-2">{d?.name || "—"}</td>
                        <td className="px-2 py-2">{d ? [d.category, d.country].filter(Boolean).join(" · ") : "—"}</td>
                        <td className="px-2 py-2">{d?.category || "—"}</td>
                        <td className="px-2 py-2">{g._count._all}</td>
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

  if (type === "productividad") {
    // Tareas creadas vs completadas en el rango
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

    const rows = sellers.map((s) => {
      const c = crMap.get(s.id) || 0;
      const d = dnMap.get(s.id) || 0;
      const rate = c > 0 ? Math.round((d / c) * 100) : 0;
      return { name: s.name || s.email || "—", created: c, done: d, rate };
    }).sort((a,b)=> b.rate - a.rate || b.done - a.done);

    content = (
      <>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Rango: {start.toLocaleDateString("es-CO")} → {end.toLocaleDateString("es-CO")}</div>
          <div className="mt-1 text-xl font-semibold">Productividad de tareas (creadas vs. completadas)</div>
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
                  <tr><td colSpan={4} className="px-2 py-8 text-center text-gray-400">Sin datos</td></tr>
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

  const exportHref = `/api/admin/reports/export${qstr({
    type,
    from: start.toISOString().slice(0,10),
    to: end.toISOString().slice(0,10),
    sellerId: sellerId || undefined,
  })}`;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500">Análisis y exportaciones.</p>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-4">
        <form className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-5" method="GET">
          <select name="type" defaultValue={type} className="rounded-md border px-3 py-2 text-sm">
            <option value="reservas">Reservas por estado</option>
            <option value="destinos">Top destinos</option>
            <option value="productividad">Productividad (tareas)</option>
          </select>
          <input type="date" name="from" defaultValue={start.toISOString().slice(0,10)} className="rounded-md border px-3 py-2 text-sm" />
          <input type="date" name="to" defaultValue={end.toISOString().slice(0,10)} className="rounded-md border px-3 py-2 text-sm" />
          <select name="sellerId" defaultValue={sellerId} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Vendedor (todos)</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">Aplicar</button>
            <a href={exportHref} className="rounded-md border px-3 py-2 text-sm">Exportar CSV</a>
          </div>
        </form>

        {content}
      </div>
    </div>
  );
}
