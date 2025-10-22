export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

import KpiCard from "@/app/components/seller/KpiCard";
import TopDestinosSection from "@/app/components/admin/TopDestinosSection";
import ConfirmadosVsPerdidosChart from "@/app/components/admin/ConfirmadosVsPedidosChart";
import MonthlyLeadsChart from "@/app/components/admin/MonthlyLeadsChart";
import HomeDateFilter from "@/app/components/HomeDateFilter";

// ==== helpers de fechas basados en una referencia ====
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function monthsAgoFrom(base: Date, n: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function parseAsOf(asOf?: string | string[]) {
  const raw = Array.isArray(asOf) ? asOf[0] : asOf;
  if (!raw) return new Date();
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(dt.getTime()) ? new Date() : dt;
}

// ==== utilidades de variación ====
function getDelta(curr: number, prev: number) {
  const diff = curr - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : null; // null si no hay base
  const up = diff > 0;
  const down = diff < 0;
  const neutral = diff === 0;
  return { diff, pct, up, down, neutral };
}

function DeltaBadge({
  curr,
  prev,
  label = "vs mes anterior",
}: {
  curr: number;
  prev: number;
  label?: string;
}) {
  const { pct, up, down } = getDelta(curr, prev);
  if (pct === null) {
    return (
      <span className="mt-1 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
        sin base {label}
      </span>
    );
  }
  const cls = up
    ? "bg-emerald-50 text-emerald-700"
    : down
    ? "bg-rose-50 text-rose-700"
    : "bg-gray-100 text-gray-600";
  const arrow = up ? "▲" : down ? "▼" : "—";
  return (
    <span className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] ${cls}`}>
      {arrow} {Math.abs(pct)}% {label}
    </span>
  );
}

type RowYMCount = { ym: string; count: bigint };

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  // evitar caché del request
  noStore();

  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  // === fecha de referencia (filtra TODO “hasta” esa fecha) ===
  const refDate = parseAsOf(searchParams?.asOf);
  const monthStart = startOfMonth(refDate);
  const rangeEnd = endOfDay(refDate);
  const yearStart = monthsAgoFrom(refDate, 11); // 12 meses terminando en refDate

  // --- Mes anterior (para comparativas)
  const prevMonthStart = monthsAgoFrom(refDate, 1);
  const prevMonthEnd = endOfMonth(prevMonthStart);

  // ===== KPIs fila 1 (Vendedores | Clientes | Leads totales)
  const kpisPromise = Promise.all([
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.client.count(),
    prisma.reservation.count({
      where: { createdAt: { lte: rangeEnd } }, // <= refDate
    }),
  ]);

  // ===== KPIs fila 2 (Actuales)
  const statusPromise = Promise.all([
    prisma.reservation.count({
      where: {
        status: { in: ["LEAD", "QUOTED", "HOLD"] },
        createdAt: { lte: rangeEnd },
      },
    }),
    prisma.reservation.count({
      where: {
        status: "CONFIRMED",
        createdAt: { lte: rangeEnd },
      },
    }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: monthStart, lte: rangeEnd }, // mes de ref
      },
    }),
  ]);

  // ===== Comparativas (mes anterior)
  const prevKPIsPromise = Promise.all([
    prisma.reservation.count({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    }),
  ]);

  // ===== Series (12 meses) — usamos createdAt BETWEEN yearStart AND rangeEnd
  const seriesTotalPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "createdAt" >= ${yearStart}
      AND "createdAt" <= ${rangeEnd}
    GROUP BY 1
    ORDER BY 1
  `;

  const seriesConfirmedPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "createdAt" >= ${yearStart}
      AND "createdAt" <= ${rangeEnd}
      AND "status" = 'CONFIRMED'
    GROUP BY 1
    ORDER BY 1
  `;

  const seriesLostPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "createdAt" >= ${yearStart}
      AND "createdAt" <= ${rangeEnd}
      AND "status" IN ('CANCELED','EXPIRED')
    GROUP BY 1
    ORDER BY 1
  `;

  const [
    [sellersCount, clientsCount, leadsTotal],
    [openLeadsCount, confirmedCount, leadsThisMonth],
    [prevConfirmedCount, prevLeadsThisMonth],
    seriesTotal,
    seriesConfirmed,
    seriesLost,
  ] = await Promise.all([
    kpisPromise,
    statusPromise,
    prevKPIsPromise,
    seriesTotalPromise,
    seriesConfirmedPromise,
    seriesLostPromise,
  ]);

  // ===== Normalizar etiquetas/series (12 meses hacia atrás desde refDate)
  const labels: string[] = [];
  const totalPerMonth: number[] = [];
  const confirmedPerMonth: number[] = [];
  const lostPerMonth: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = monthsAgoFrom(refDate, i);
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
          <p className="text-sm text-gray-500">Resumen general</p>
        </div>
        {/* Calendario que actualiza ?asOf=YYYY-MM-DD */}
        <HomeDateFilter />
      </header>

      {/* KPIs fila 1 */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Vendedores" value={sellersCount} />
        <KpiCard label="Clientes" value={clientsCount} />
        <KpiCard label="Leads totales" value={leadsTotal} />
      </section>

      {/* KPIs fila 2 (con comparativas) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Leads abiertos" value={openLeadsCount} />

        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Confirmadas (mes)</div>
          <div className="text-xl font-semibold">{confirmedCount}</div>
          {DeltaBadge({ curr: confirmedCount, prev: prevConfirmedCount })}
        </div>

        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Leads creados (mes)</div>
          <div className="text-xl font-semibold">{leadsThisMonth}</div>
          {DeltaBadge({ curr: leadsThisMonth, prev: prevLeadsThisMonth })}
        </div>
      </section>

      {/* Gráficas */}
      <section className="grid gap-4 lg:grid-cols-2">
        <MonthlyLeadsChart labels={labels} values={totalPerMonth} />
        <section className="grid gap-4 lg:grid-cols-1">
          <ConfirmadosVsPerdidosChart
            labels={labels}
            confirmed={confirmedPerMonth}
            lost={lostPerMonth}
          />
        </section>
      </section>

      {/* Insights */}
      {/* ⚠️ Ajustaremos este componente para que no requiera businessId */}
      <TopDestinosSection />
    </div>
  );
}
