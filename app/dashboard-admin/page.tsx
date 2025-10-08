import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import KpiCard from "@/app/components/seller/KpiCard";
import Sparkline from "@/app/components/seller/Sparkline";
import TopDestinosSection from "../components/admin/TopDestinosSection";
import ConfirmadosVsPerdidosChart from "../components/admin/ConfirmadosVsPedidosChart";

// === utils de fechas (mes a mes, 12 puntos) ===
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
function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type RowYMCount = { ym: string; count: bigint };

export default async function AdminHomePage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const monthStart = startOfMonth();
  const yearStart = monthsAgo(11); // desde el inicio de hace 11 meses => 12 meses cerrados

  // ===== KPIs fila 1 (Vendedores | Clientes | Leads totales)
  const kpisPromise = Promise.all([
    prisma.user.count({ where: { businessId, role: "SELLER" } }), // vendedores
    prisma.client.count({ where: { businessId } }), // clientes
    prisma.reservation.count({ where: { businessId } }), // leads totales (reservas como registros)
  ]);

  // ===== KPIs fila 2 (Leads abiertos | Confirmadas | Leads creados este mes)
  const statusPromise = Promise.all([
    prisma.reservation.count({
      where: { businessId, status: { in: ["LEAD", "QUOTED", "HOLD"] } },
    }),
    prisma.reservation.count({
      where: { businessId, status: "CONFIRMED" },
    }),
    prisma.reservation.count({
      where: { businessId, createdAt: { gte: monthStart } }, // coherente con la idea de "este mes"
    }),
  ]);

  // ===== Series mensuales (siempre 12 meses, por createdAt)
  // 1) Total de leads creados por mes
  const seriesTotalPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "businessId" = ${businessId}
      AND "createdAt" >= ${yearStart}
    GROUP BY 1
    ORDER BY 1
  `;

  // 2) Confirmados por mes
  const seriesConfirmedPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "businessId" = ${businessId}
      AND "createdAt" >= ${yearStart}
      AND "status" = 'CONFIRMED'
    GROUP BY 1
    ORDER BY 1
  `;

  // 3) Perdidos por mes (Cancelados + Expirados)
  const seriesLostPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "businessId" = ${businessId}
      AND "createdAt" >= ${yearStart}
      AND "status" IN ('CANCELED','EXPIRED')
    GROUP BY 1
    ORDER BY 1
  `;

  const [
    [sellersCount, clientsCount, leadsTotal],
    [openLeadsCount, confirmedCount, leadsThisMonth],
    seriesTotal,
    seriesConfirmed,
    seriesLost,
  ] = await Promise.all([
    kpisPromise,
    statusPromise,
    seriesTotalPromise,
    seriesConfirmedPromise,
    seriesLostPromise,
  ]);

  // ===== Normalizar 12 meses contiguos (sin saltos)
  const labels: string[] = [];
  const totalPerMonth: number[] = [];
  const confirmedPerMonth: number[] = [];
  const lostPerMonth: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(i);
    const key = ymKey(d);
    labels.push(key);

    const t = seriesTotal.find((r) => r.ym === key);
    const c = seriesConfirmed.find((r) => r.ym === key);
    const l = seriesLost.find((r) => r.ym === key);

    totalPerMonth.push(t ? Number(t.count) : 0);
    confirmedPerMonth.push(c ? Number(c.count) : 0);
    lostPerMonth.push(l ? Number(l.count) : 0);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel de control</h1>
          <p className="text-sm text-gray-500">Resumen del negocio</p>
        </div>
        <span className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600">
          Actualizado al {new Date().toLocaleDateString("es-CO")}
        </span>
      </header>

      {/* KPIs fila 1 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Vendedores" value={sellersCount} />
        <KpiCard label="Clientes" value={clientsCount} />
        <KpiCard label="Leads totales" value={leadsTotal} />
      </section>

      {/* KPIs fila 2 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Leads abiertos" value={openLeadsCount} />
        <KpiCard label="Confirmadas" value={confirmedCount} />
        <KpiCard label="Leads creados este mes" value={leadsThisMonth} />
      </section>

      {/* Gráficas: 12 meses (sin saltos) */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Tendencia de leads creados (total) */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leads creados (mes a mes)</h2>
            <span className="text-xs text-gray-500">últimos 12 meses</span>
          </div>
          <div className="h-64">
            <Sparkline labels={labels} values={totalPerMonth} />
          </div>
        </div>
        <section className="grid gap-4 lg:grid-cols-1">
          {/* Confirmados vs Perdidos (componente nuevo) */}
          <ConfirmadosVsPerdidosChart
            labels={labels}
            confirmed={confirmedPerMonth}
            lost={lostPerMonth}
          />
        </section>
      </section>

      {/* Insights: Top destinos (puedes sumar "Top vendedores" si quieres) */}
      <TopDestinosSection businessId={businessId} />
    </div>
  );
}
