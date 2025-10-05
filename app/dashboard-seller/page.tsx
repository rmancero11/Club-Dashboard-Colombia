import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import KpiCard from "@/app/components/seller/KpiCard";
import Sparkline from "@/app/components/seller/Sparkline";
import TopDestinationsTable from "@/app/components/seller/TopDestinationsTable";
import TaskList from "@/app/components/seller/TaskList";
import { notFound, redirect } from "next/navigation";

// Util: primer día del mes (00:00)
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
// Util: hace N meses
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0,0,0,0);
  return d;
}

export default async function SellerHomePage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "SELLER" && auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) {
    // sin empresa asociada, no hay datos que mostrar
    notFound();
  }

  const sellerId = auth.userId;
  const businessId = auth.businessId!;
  const monthStart = startOfMonth();
  const yearStart = monthsAgo(11); // últimos 12 meses (incluye el actual)

  // KPIs
  const kpisPromise = Promise.all([
    prisma.reservation.count({ where: { businessId, sellerId } }),
    prisma.reservation.count({
      where: { businessId, sellerId, status: { in: ["PENDING", "DRAFT"] } },
    }),
    prisma.reservation.count({
      where: { businessId, sellerId, status: "CONFIRMED" },
    }),
    prisma.reservation.count({
      where: { businessId, sellerId, startDate: { gte: monthStart } },
    }),
  ]);

  // Serie de reservas por mes (últimos 12 meses)
  // Usamos raw SQL para agrupar por mes (Postgres)
  const seriesPromise = prisma.$queryRaw<
    { ym: string; count: bigint }[]
  >`
    SELECT to_char(date_trunc('month', "startDate"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "businessId" = ${businessId}
      AND "sellerId" = ${sellerId}
      AND "startDate" >= ${yearStart}
    GROUP BY 1
    ORDER BY 1
  `;

  // Top destinos (por cantidad de reservas)
  const topDestinationsPromise = prisma.$queryRaw<
    { name: string; cnt: bigint }[]
  >`
    SELECT d."name" AS name, COUNT(r.*)::bigint AS cnt
    FROM "Reservation" r
    JOIN "Destination" d ON d."id" = r."destinationId"
    WHERE r."businessId" = ${businessId}
      AND r."sellerId" = ${sellerId}
    GROUP BY d."name"
    ORDER BY cnt DESC
    LIMIT 5
  `;

  // Tareas pendientes
  const tasksPromise = prisma.task.findMany({
    where: {
      businessId,
      sellerId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      priority: true,
      reservationId: true,
    },
  });

  const [[total, pending, confirmed, thisMonth], rawSeries, topDest, tasks] =
    await Promise.all([kpisPromise, seriesPromise, topDestinationsPromise, tasksPromise]);

  // Normaliza serie a 12 meses continuos (YYYY-MM)
  const labels: string[] = [];
  const counts: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    labels.push(ym);
    const found = rawSeries.find((r: { ym: string; }) => r.ym === ym);
    counts.push(found ? Number(found.count) : 0);
  }

  const topRows = topDest.map((r: { name: any; cnt: any; }) => ({ name: r.name, count: Number(r.cnt) }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-gray-500">Resumen de tus métricas.</p>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Reservas totales" value={total} />
        <KpiCard label="Pendientes" value={pending} />
        <KpiCard label="Confirmadas" value={confirmed} />
        <KpiCard label="Este mes" value={thisMonth} />
      </section>

      {/* Tendencia + Destinos */}
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
          <h2 className="mb-2 text-lg font-semibold">Destinos más populares</h2>
          <TopDestinationsTable rows={topRows} />
        </div>
      </section>

      {/* Tareas */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Tareas pendientes</h2>
        <TaskList tasks={tasks} />
        <div className="mt-3">
          <a href="/dashboard-seller/tareas" className="text-sm text-primary underline">
            Ver todas
          </a>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="flex flex-wrap gap-3">
        <a href="/dashboard-seller/reservas/nueva" className="rounded-lg bg-black px-4 py-2 text-white">
          Nueva reserva
        </a>
        <a href="/dashboard-seller/reservas" className="rounded-lg border px-4 py-2">
          Buscar reserva
        </a>
      </section>
    </div>
  );
}
