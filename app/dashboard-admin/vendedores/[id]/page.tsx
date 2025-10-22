import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

function startEndOfMonth(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
function fmtMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

const RES_PENDING = ["LEAD", "QUOTED", "HOLD"] as const;
const TASK_PENDING = ["OPEN", "IN_PROGRESS", "BLOCKED"] as const;

const RES_STATUS_LABELS: Record<string, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  HOLD: "En espera",
  CONFIRMED: "Confirmada",
  TRAVELING: "En viaje",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Vencida",
};
const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Terminada",
  CANCELLED: "Cancelada",
};
const TASK_PRIORITY_LABELS: Record<string, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export default async function AdminSellerDetailPage({
  params,
}: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  // ---------- Perfil ----------
  const seller = await prisma.user.findFirst({
    where: { id: params.id, role: "SELLER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      commissionRate: true,
      status: true,
      createdAt: true,
    },
  });
  if (!seller) notFound();

  const now = new Date();
  const { start, end } = startEndOfMonth();

  // ---------- Métricas principales en paralelo ----------
  const [
    clientsCount,
    resTotalAgg,
    resMonthAgg,
    tasksPendingCount,
    tasksOverdueCount,
    resByStatus,
    tasksByStatus,
    tasksByPriority,
    topDestGroupRaw,
    recentReservations,
    recentTasks,
    recentClients,
    recentActivity,
  ] = await Promise.all([
    prisma.client.count({ where: { sellerId: seller.id } }),
    prisma.reservation.aggregate({
      where: { sellerId: seller.id },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.reservation.aggregate({
      where: { sellerId: seller.id, startDate: { gte: start, lte: end } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.task.count({
      where: { sellerId: seller.id, status: { in: TASK_PENDING as any } },
    }),
    prisma.task.count({
      where: {
        sellerId: seller.id,
        status: { in: TASK_PENDING as any },
        dueDate: { lt: now },
      },
    }),
    prisma.reservation.groupBy({
      where: { sellerId: seller.id },
      by: ["status"],
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.task.groupBy({
      where: { sellerId: seller.id },
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      where: { sellerId: seller.id },
      by: ["priority"],
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      where: { sellerId: seller.id },
      by: ["destinationId"],
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.reservation.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        code: true,
        status: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        client: { select: { name: true } },
        destination: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
      },
    }),
    prisma.client.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    }),
    prisma.activityLog.findMany({
      where: { userId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, message: true, createdAt: true },
    }),
  ]);

  const totalResCount = resTotalAgg._count?._all ?? 0;
  const totalResSum = Number(resTotalAgg._sum?.totalAmount ?? 0);
  const monthResCount = resMonthAgg._count?._all ?? 0;
  const monthResSum = Number(resMonthAgg._sum?.totalAmount ?? 0);

  const pendingResCount = resByStatus
    .filter((r) => (RES_PENDING as readonly string[]).includes(r.status))
    .reduce((acc, r) => acc + (r._count?._all ?? 0), 0);

  const avgTicket = totalResCount > 0 ? totalResSum / totalResCount : 0;
  const tenureDays = daysBetween(seller.createdAt, now);

  // Top destinos: ordenar en memoria y mapear IDs -> nombres
  const topDestSorted = [...topDestGroupRaw]
    .sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0))
    .slice(0, 5);

  const topDestIds = topDestSorted.map((d) => d.destinationId);
  const topDestinationNames = topDestIds.length
    ? await prisma.destination.findMany({
        where: { id: { in: topDestIds } },
        select: { id: true, name: true },
      })
    : [];
  const destNameById = Object.fromEntries(topDestinationNames.map((d) => [d.id, d.name]));

  const statusPill =
    seller.status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-gray-200 bg-gray-100 text-gray-600";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{seller.name || "Vendedor"}</h1>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusPill}`}>
              {seller.status === "ACTIVE" ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {seller.email} · {seller.phone || "—"} · {seller.country || "—"}
          </p>
          <p className="text-xs text-gray-400">
            Alta: {new Date(seller.createdAt).toLocaleDateString("es-CO")} · Antigüedad: {tenureDays} días
            {seller.commissionRate != null ? ` · Comisión: ${Number(seller.commissionRate).toFixed(2)}%` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/dashboard-admin/usuarios/${seller.id}`} className="rounded-md border px-3 py-2 text-sm">
            Editar
          </a>
          <a href="/dashboard-admin/vendedores" className="rounded-md border px-3 py-2 text-sm">
            ← Volver
          </a>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid w-full gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Clientes</div>
          <div className="text-2xl font-semibold">{clientsCount}</div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Reservas (pendientes)</div>
          <div className="text-2xl font-semibold">{pendingResCount}</div>
          <div className="text-[11px] text-amber-600">
            {`${RES_STATUS_LABELS.LEAD}/${RES_STATUS_LABELS.QUOTED}/${RES_STATUS_LABELS.HOLD}`}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Tareas (pendientes)</div>
          <div className="text-2xl font-semibold">{tasksPendingCount}</div>
          <div className="text-[11px] text-sky-600">
            {`${TASK_STATUS_LABELS.OPEN}/${TASK_STATUS_LABELS.IN_PROGRESS}/${TASK_STATUS_LABELS.BLOCKED}`}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Tareas atrasadas</div>
          <div className="text-2xl font-semibold">{tasksOverdueCount}</div>
          <div className="text-[11px] text-rose-600">con fecha vencida</div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Ticket promedio</div>
          <div className="text-2xl font-semibold">{fmtMoney(avgTicket)}</div>
          <div className="text-[11px] text-gray-500">en todas las reservas</div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Ventas (mes)</div>
          <div className="text-2xl font-semibold">{fmtMoney(monthResSum)}</div>
          <div className="text-[11px] text-gray-500">{monthResCount} reservas</div>
        </div>
      </section>

      {/* Embudos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Embudo de reservas</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            {["LEAD","QUOTED","HOLD","CONFIRMED","TRAVELING","COMPLETED","CANCELED","EXPIRED"].map((st) => {
              const row = resByStatus.find((r) => r.status === st);
              const c = row?._count?._all ?? 0;
              const pill =
                st === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                st === "CONFIRMED" ? "bg-sky-50 border-sky-200 text-sky-700" :
                st === "HOLD" ? "bg-amber-50 border-amber-200 text-amber-700" :
                st === "QUOTED" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                st === "LEAD" ? "bg-gray-50 border-gray-200 text-gray-700" :
                st === "TRAVELING" ? "bg-cyan-50 border-cyan-200 text-cyan-700" :
                st === "CANCELED" ? "bg-rose-50 border-rose-200 text-rose-700" :
                "bg-stone-50 border-stone-200 text-stone-700";
              return (
                <li key={st} className={`rounded-lg border p-3 ${pill}`}>
                  <div className="text-xs font-medium">{RES_STATUS_LABELS[st] ?? st}</div>
                  <div className="mt-1 text-base font-semibold">{c}</div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Tareas por estado y prioridad</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 text-sm font-medium text-gray-600">Por estado</div>
              <ul className="space-y-1 text-sm">
                {["OPEN", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"].map((st) => {
                  const row = tasksByStatus.find((t) => t.status === st);
                  const c = row?._count?._all ?? 0;
                  return (
                    <li key={st} className="flex items-center justify-between rounded-md border px-2 py-1">
                      <span>{TASK_STATUS_LABELS[st] ?? st}</span>
                      <span className="font-semibold">{c}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-gray-600">Por prioridad</div>
              <ul className="space-y-1 text-sm">
                {["HIGH", "MEDIUM", "LOW"].map((p) => {
                  const row = tasksByPriority.find((t) => t.priority === p);
                  const c = row?._count?._all ?? 0;
                  return (
                    <li key={p} className="flex items-center justify-between rounded-md border px-2 py-1">
                      <span>{TASK_PRIORITY_LABELS[p] ?? p}</span>
                      <span className="font-semibold">{c}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Listas */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Reservas recientes</h2>
          {recentReservations.length === 0 ? (
            <div className="text-gray-400">Sin reservas</div>
          ) : (
            <ul className="divide-y">
              {recentReservations.map((r) => {
                const statusPill =
                  r.status === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                  r.status === "CONFIRMED" ? "bg-sky-50 border-sky-200 text-sky-700" :
                  r.status === "HOLD" ? "bg-amber-50 border-amber-200 text-amber-700" :
                  r.status === "QUOTED" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                  r.status === "LEAD" ? "bg-gray-50 border-gray-200 text-gray-700" :
                  r.status === "TRAVELING" ? "bg-cyan-50 border-cyan-200 text-cyan-700" :
                  r.status === "CANCELED" ? "bg-rose-50 border-rose-200 text-rose-700" :
                  "bg-stone-50 border-stone-200 text-stone-700";
                return (
                  <li key={r.id} className="py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {r.destination?.name || "—"} · {r.client?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(r.startDate).toLocaleDateString("es-CO")} →{" "}
                          {new Date(r.endDate).toLocaleDateString("es-CO")}{" · "}
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-[1px] text-[10px] ${statusPill}`}>
                            {RES_STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Creada: {new Date(r.createdAt).toLocaleDateString("es-CO")}
                        </div>
                      </div>
                      <div className="text-sm whitespace-nowrap">
                        {fmtMoney(Number(r.totalAmount), r.currency)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Tareas recientes</h2>
          {recentTasks.length === 0 ? (
            <div className="text-gray-400">Sin tareas</div>
          ) : (
            <ul className="divide-y">
              {recentTasks.map((t) => (
                <li key={t.id} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-gray-500">
                        {TASK_STATUS_LABELS[t.status] ?? t.status} · {TASK_PRIORITY_LABELS[t.priority] ?? t.priority}
                        {t.dueDate ? ` · vence ${new Date(t.dueDate).toLocaleDateString("es-CO")}` : ""}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Creada: {new Date(t.createdAt).toLocaleDateString("es-CO")}
                      </div>
                    </div>
                    <a className="text-sm text-primary underline whitespace-nowrap" href={`/dashboard-admin/tareas/${t.id}`}>
                      Ver
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Top destinos + Clientes recientes + Actividad */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Top destinos</h2>
          {topDestSorted.length === 0 ? (
            <div className="text-gray-400">Sin datos</div>
          ) : (
            <ul className="divide-y text-sm">
              {topDestSorted.map((d) => (
                <li key={d.destinationId} className="flex items-center justify-between py-2">
                  <div className="truncate">{destNameById[d.destinationId] || "Destino"}</div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold">{d._count?._all ?? 0}</span>
                    <span className="text-gray-500">{fmtMoney(Number(d._sum?.totalAmount ?? 0))}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Clientes recientes</h2>
          {recentClients.length === 0 ? (
            <div className="text-gray-400">Sin clientes</div>
          ) : (
            <ul className="divide-y text-sm">
              {recentClients.map((c) => (
                <li key={c.id} className="py-2">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {c.email || "—"} {c.phone ? `· ${c.phone}` : ""}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Alta: {new Date(c.createdAt).toLocaleDateString("es-CO")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Actividad reciente</h2>
          {recentActivity.length === 0 ? (
            <div className="text-gray-400">Sin actividad</div>
          ) : (
            <ul className="divide-y text-sm">
              {recentActivity.map((a) => (
                <li key={a.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.action}</span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  {a.message && <div className="text-xs text-gray-600">{a.message}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
