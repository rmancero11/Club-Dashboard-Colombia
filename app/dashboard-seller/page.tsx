import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import KpiCard from "@/app/components/seller/KpiCard";
import TopDestinationsTable from "@/app/components/seller/TopDestinationsTable";
import TaskList from "@/app/components/seller/TaskList";
import { redirect } from "next/navigation";
import ReservationTrend from "../components/seller/ReservationTrend";

// Util: primer día del mes (00:00)
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
// Util: hace N meses y lo posiciona al inicio de ese mes
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function SellerHomePage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  // Esta página es SOLO para vendedores
  if (auth.role !== "SELLER") redirect("/unauthorized");

  const sellerId = auth.userId;
  const monthStart = startOfMonth();
  const yearStart = monthsAgo(11); // últimos 12 meses (incluye el actual)

  // KPIs (filtradas por seller)
  const [total, pending, confirmed, thisMonth] = await Promise.all([
    prisma.reservation.count({ where: { sellerId } }),
    prisma.reservation.count({
      where: { sellerId, status: { in: ["LEAD"] } },
    }),
    prisma.reservation.count({
      where: { sellerId, status: "CONFIRMED" },
    }),
    prisma.reservation.count({
      where: { sellerId, startDate: { gte: monthStart } },
    }),
  ]);

  // Serie de reservas por mes (últimos 12 meses)
  // Postgres: agrupamos por mes (YYYY-MM)
  const rawSeries = await prisma.$queryRaw<{ ym: string; count: bigint }[]>`
    SELECT to_char(date_trunc('month', "startDate"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "sellerId" = ${sellerId}
      AND "startDate" >= ${yearStart}
    GROUP BY 1
    ORDER BY 1
  `;

  // Top destinos (por cantidad de reservas del seller)
  const topDest = await prisma.$queryRaw<{ name: string; cnt: bigint }[]>`
    SELECT d."name" AS name, COUNT(r.*)::bigint AS cnt
    FROM "Reservation" r
    JOIN "Destination" d ON d."id" = r."destinationId"
    WHERE r."sellerId" = ${sellerId}
    GROUP BY d."name"
    ORDER BY cnt DESC
    LIMIT 5
  `;

  // Tareas pendientes del seller
  const tasks = await prisma.task.findMany({
    where: {
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

  // Normaliza serie a 12 meses continuos (YYYY-MM)
  const labels: string[] = [];
  const counts: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    labels.push(ym);
    const found = rawSeries.find((r) => r.ym === ym);
    counts.push(found ? Number(found.count) : 0);
  }

  const topRows = topDest.map((r) => ({
    name: r.name,
    count: Number(r.cnt),
  }));

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
          <ReservationTrend sellerId={sellerId} months={6} />
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
          <a
            href="/dashboard-seller/tareas"
            className="text-sm text-primary underline"
          >
            Ver todas
          </a>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="flex flex-wrap gap-3">
        <a
          href="/dashboard-seller/reservas/nueva"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Nueva reserva
        </a>
        <a
          href="/dashboard-seller/reservas"
          className="rounded-lg border px-4 py-2"
        >
          Buscar reserva
        </a>
      </section>
    </div>
  );
}
