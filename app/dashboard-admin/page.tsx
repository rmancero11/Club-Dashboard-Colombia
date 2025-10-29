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

// ==== helpers de fechas ====
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function parseYMD(s?: string | string[]) {
  const raw = Array.isArray(s) ? s[0] : s;
  if (!raw) return null;
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(dt.getTime()) ? null : dt;
}
/**
 * Prioridad de parsing:
 * - Si vienen from & to => usar rango [from..to].
 * - Si viene asOf => usar [startOfMonth(asOf)..endOfDay(asOf)] (compatibilidad).
 * - Si nada => [primer día mes actual .. hoy].
 */
function parseDateRange(sp?: { [k: string]: string | string[] | undefined }) {
  const today = new Date();
  const fromParam = parseYMD(sp?.from);
  const toParam = parseYMD(sp?.to);
  const asOfParam = parseYMD(sp?.asOf);

  if (fromParam && toParam) {
    const start = startOfDay(fromParam);
    const end = endOfDay(toParam);
    if (start > end) {
      // corrige inversión si llega mal
      return { rangeStart: startOfDay(toParam), rangeEnd: endOfDay(fromParam) };
    }
    return { rangeStart: start, rangeEnd: end };
  }

  if (asOfParam) {
    return {
      rangeStart: startOfMonth(asOfParam),
      rangeEnd: endOfDay(asOfParam),
    };
  }

  return { rangeStart: startOfMonth(today), rangeEnd: endOfDay(today) };
}

function getDelta(curr: number, prev: number) {
  const diff = curr - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
  const up = diff > 0;
  const down = diff < 0;
  const neutral = diff === 0;
  return { diff, pct, up, down, neutral };
}

function DeltaBadge({
  curr,
  prev,
  label = "vs periodo anterior",
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

// Genera un arreglo de claves YYYY-MM desde el inicio del mes de rangeStart hasta el fin de mes de rangeEnd
function monthKeysBetween(rangeStart: Date, rangeEnd: Date) {
  const keys: string[] = [];
  const start = startOfMonth(rangeStart);
  const end = endOfMonth(rangeEnd);
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(ymKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  noStore();

  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  // === rango de fechas ===
  const { rangeStart, rangeEnd } = parseDateRange(searchParams);

  // === periodo anterior (misma duración)
  const daysInRange = Math.max(
    1,
    Math.ceil((endOfDay(rangeEnd).getTime() - startOfDay(rangeStart).getTime()) / (1000 * 60 * 60 * 24)) + 0
  );
  const prevRangeEnd = addDays(startOfDay(rangeStart), -1);
  const prevRangeStart = addDays(prevRangeEnd, -(daysInRange - 1));

  // ===== KPIs fila 1 (filtrados por periodo)
  const kpisPromise = Promise.all([
    prisma.user.count({
      where: {
        role: "SELLER",
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
    prisma.client.count({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
  ]);

  // ===== KPIs fila 2 (estado en el periodo)
  const statusPromise = Promise.all([
    prisma.reservation.count({
      where: {
        status: { in: ["LEAD", "QUOTED", "HOLD"] },
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
    prisma.reservation.count({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
  ]);

  // ===== Comparativas (periodo anterior de igual duración)
  const prevKPIsPromise = Promise.all([
    prisma.reservation.count({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: prevRangeStart, lte: prevRangeEnd },
      },
    }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: prevRangeStart, lte: prevRangeEnd },
      },
    }),
  ]);

  // ===== Series (entre meses de rangeStart y rangeEnd)
  const seriesTotalPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "createdAt" >= ${rangeStart}
      AND "createdAt" <= ${rangeEnd}
    GROUP BY 1
    ORDER BY 1
  `;

  const seriesConfirmedPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "createdAt" >= ${rangeStart}
      AND "createdAt" <= ${rangeEnd}
      AND "status" = 'CONFIRMED'
    GROUP BY 1
    ORDER BY 1
  `;

  const seriesLostPromise = prisma.$queryRaw<RowYMCount[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "createdAt" >= ${rangeStart}
      AND "createdAt" <= ${rangeEnd}
      AND "status" IN ('CANCELED','EXPIRED')
    GROUP BY 1
    ORDER BY 1
  `;

  const [
    [sellersCount, clientsCount, leadsTotal],
    [openLeadsCount, confirmedCount, leadsInPeriod],
    [prevConfirmedCount, prevLeadsInPeriod],
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

  // ===== Normalizar etiquetas/series dinámicas del rango
  const labels = monthKeysBetween(rangeStart, rangeEnd);
  const totalPerMonth: number[] = [];
  const confirmedPerMonth: number[] = [];
  const lostPerMonth: number[] = [];

  for (const key of labels) {
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
          <p className="text-sm text-gray-500">
            Resumen general ({rangeStart.toISOString().slice(0,10)} → {rangeEnd.toISOString().slice(0,10)})
          </p>
        </div>
        {/* Debe actualizar ?from=YYYY-MM-DD&to=YYYY-MM-DD (o asOf=YYYY-MM-DD para modo anterior) */}
        <HomeDateFilter />
      </header>

      {/* KPIs fila 1 (filtrados por periodo) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Vendedores (periodo)" value={sellersCount} />
        <KpiCard label="Clientes (periodo)" value={clientsCount} />
        <KpiCard label="Leads totales (periodo)" value={leadsTotal} />
      </section>

      {/* KPIs fila 2 (con comparativas al periodo anterior) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Leads abiertos (periodo)" value={openLeadsCount} />

        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Confirmadas (periodo)</div>
          <div className="text-xl font-semibold">{confirmedCount}</div>
          {DeltaBadge({ curr: confirmedCount, prev: prevConfirmedCount })}
        </div>

        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Leads creados (periodo)</div>
          <div className="text-xl font-semibold">{leadsInPeriod}</div>
          {DeltaBadge({ curr: leadsInPeriod, prev: prevLeadsInPeriod })}
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
      <TopDestinosSection />
    </div>
  );
}
