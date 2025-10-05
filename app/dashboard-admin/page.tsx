import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import KpiCard from "@/app/components/seller/KpiCard";
import Sparkline from "@/app/components/seller/Sparkline";

// utils de fechas
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminHomePage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const monthStart = startOfMonth();
  const yearStart = monthsAgo(11); // 12 meses

  // KPIs principales
  const kpisPromise = Promise.all([
    prisma.user.count({ where: { businessId } }),                                // total usuarios (todas las cuentas)
    prisma.user.count({ where: { businessId, role: "SELLER" } }),                // vendedores
    prisma.client.count({ where: { businessId } }),                               // clientes
    prisma.reservation.count({ where: { businessId } }),                          // reservas totales
  ]);

  // Kpis de estado de reservas
  const statusPromise = Promise.all([
    prisma.reservation.count({ where: { businessId, status: "PENDING" } }),
    prisma.reservation.count({ where: { businessId, status: "CONFIRMED" } }),
    prisma.reservation.count({ where: { businessId, startDate: { gte: monthStart } } }), // reservas este mes (cualquier estado)
  ]);

  // Serie de reservas por mes (12 meses) – todas las reservas de la empresa
  const seriesPromise = prisma.$queryRaw<{ ym: string; count: bigint }[]>`
    SELECT to_char(date_trunc('month', "startDate"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "businessId" = ${businessId}
      AND "startDate" >= ${yearStart}
    GROUP BY 1
    ORDER BY 1
  `;

  // Top destinos (empresa)
  const rowsDestinosPromise = prisma.$queryRaw<{ name: string; cnt: bigint }[]>`
    SELECT d."name" AS name, COUNT(r.*)::bigint AS cnt
    FROM "Reservation" r
    JOIN "Destination" d ON d."id" = r."destinationId"
    WHERE r."businessId" = ${businessId}
    GROUP BY d."name"
    ORDER BY cnt DESC
    LIMIT 5
  `;

  const [[totalUsers, sellersCount, clientsCount, reservationsCount], [pendingCount, confirmedCount, thisMonthCount], rawSeries, topDest] =
    await Promise.all([kpisPromise, statusPromise, seriesPromise, rowsDestinosPromise]);

  // Normaliza serie 12 meses contiguos
  const labels: string[] = [];
  const counts: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    labels.push(ym);
    const found = rawSeries.find((r) => r.ym === ym);
    counts.push(found ? Number(found.count) : 0);
  }

  const topRows = topDest.map((r) => ({ name: r.name, count: Number(r.cnt) }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Inicio (Admin)</h1>
        <p className="text-sm text-gray-500">Resumen del negocio.</p>
      </header>

      {/* KPIs fila 1 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Usuarios (cuentas)" value={totalUsers} />
        <KpiCard label="Vendedores" value={sellersCount} />
        <KpiCard label="Clientes" value={clientsCount} />
        <KpiCard label="Reservas totales" value={reservationsCount} />
      </section>

      {/* KPIs fila 2 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Reservas pendientes" value={pendingCount} />
        <KpiCard label="Reservas confirmadas" value={confirmedCount} />
        <KpiCard label="Reservas este mes" value={thisMonthCount} />
      </section>

      {/* Tendencia + Top destinos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tendencia de reservas</h2>
            <span className="text-xs text-gray-500">últimos 12 meses</span>
          </div>
          <div className="h-64">
            <Sparkline labels={labels} values={counts} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Top destinos</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Destino</th>
                  <th className="px-2 py-2">Reservas</th>
                </tr>
              </thead>
              <tbody>
                {topRows.length === 0 && (
                  <tr><td colSpan={2} className="px-2 py-10 text-center text-gray-400">Sin datos</td></tr>
                )}
                {topRows.map((r) => (
                  <tr key={r.name} className="border-t">
                    <td className="px-2 py-2">{r.name}</td>
                    <td className="px-2 py-2">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="flex flex-wrap gap-3">
        <a href="/dashboard-admin/usuarios" className="rounded-lg border px-4 py-2">Gestionar usuarios</a>
        <a href="/dashboard-admin/vendedores" className="rounded-lg border px-4 py-2">Gestionar vendedores</a>
        <a href="/dashboard-admin/destinos" className="rounded-lg border px-4 py-2">Ver destinos</a>
        <a href="/dashboard-admin/reservas" className="rounded-lg border px-4 py-2">Ver reservas</a>
        <a href="/dashboard-admin/reportes" className="rounded-lg border px-4 py-2">Reportes</a>
      </section>
    </div>
  );
}
