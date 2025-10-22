import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

// ===== FX / Conversión =====
const FX_COP_USD = Number(process.env.FX_COP_USD || "4000");

function toUSD(amount: number, currency?: string | null) {
  const c = (currency || "USD").toUpperCase();
  if (c === "USD") return amount;
  if (c === "COP") return amount / FX_COP_USD;
  return amount;
}

// ===== Utilidades =====
function startEndOfMonth(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
function fmtMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
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

// Etiquetas en español para acciones
const ACTION_LABEL_ES: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  CREATE_CLIENT: "Cliente creado",
  UPDATE_CLIENT: "Cliente actualizado",
  LEAD_CREATED_FROM_WP: "Lead creado desde web",
  LEAD_ASSIGNED: "Lead asignado",
  CREATE_RESERVATION: "Reserva creada",
  UPDATE_RESERVATION: "Reserva actualizada",
  CHANGE_STATUS: "Cambio de estado",
  QUOTE_SENT: "Cotización enviada",
  HOLD_SET: "Reserva en espera",
  EXPIRED_AUTO: "Reserva vencida",
  WHATSAPP_SENT: "WhatsApp enviado",
  WHATSAPP_RECEIVED: "WhatsApp recibido",
  GENERATE_REPORT: "Reporte generado",
  NOTE: "Nota",
};

// Helpers para acción CHANGE_STATUS
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
function mapStatusEs(code?: string | null) {
  if (!code) return "";
  return TASK_STATUS_LABELS[code] ?? RES_STATUS_LABELS[code] ?? code;
}
function cleanIds(text?: string | null) {
  if (!text) return "";
  return text.replace(UUID_RE, "").replace(/\s{2,}/g, " ").trim();
}

// Construye título y cuerpo en español para cada actividad
function formatActivityEs(a: {
  action: string;
  message?: string | null;
  metadata?: any;
  // relaciones opcionales para nombrar el recurso
  reservation?: { code?: string | null } | null;
  client?: { name?: string | null } | null;
}): { title: string; body?: string } {
  const title = (ACTION_LABEL_ES[a.action] ?? a.action).toUpperCase();

  if (a.action === "NOTE") {
    const meta = a.metadata ?? {};
    const note = meta.note ?? meta.text ?? meta.content ?? a.message ?? "";
    return { title, body: note };
  }

  if (a.action === "CHANGE_STATUS") {
    const meta = a.metadata ?? {};
    // Intentamos identificar recurso y nombre
    const kindRaw = meta.entity ?? meta.targetType ?? meta.kind ?? meta.resource ?? "";
    const kind = String(kindRaw || "").toUpperCase();
    let recurso = "";
    if (kind.includes("TASK") || /tarea/i.test(a.message ?? "")) recurso = "Tarea";
    else if (kind.includes("RESERVATION") || /reserva/i.test(a.message ?? "")) recurso = "Reserva";
    else if (kind.includes("CLIENT") || /cliente/i.test(a.message ?? "")) recurso = "Cliente";

    // Nombre amigable
    const nombre =
      meta.title ??
      meta.name ??
      meta.code ??
      a.reservation?.code ??
      a.client?.name ??
      ""; // si no hay, se omite

    const fromEs = mapStatusEs(meta.from ?? meta.old ?? meta.prev);
    const toEs = mapStatusEs(meta.to ?? meta.new ?? meta.next);

    // Mensaje base: “Estado actualizado: De X a Y”
    let cuerpo = "";
    if (fromEs || toEs) {
      cuerpo = fromEs ? `Estado actualizado: de ${fromEs} a ${toEs || "—"}` : `Estado actualizado: ${toEs}`;
    }

    // Prefijo con recurso y nombre si lo tenemos
    if (recurso && nombre) cuerpo = `${recurso} ${nombre} — ${cuerpo || "Estado actualizado"}`;
    else if (recurso) cuerpo = `${recurso} — ${cuerpo || "Estado actualizado"}`;

    // Si todavía no hay nada, limpiamos el message original como fallback (sin IDs)
    if (!cuerpo) cuerpo = cleanIds(a.message) || "Estado actualizado";

    return { title, body: cuerpo };
  }

  // Otras acciones: prioriza message o metadata.summary/description/info
  const body =
    cleanIds(a.message) ||
    a.metadata?.summary ||
    a.metadata?.description ||
    a.metadata?.info ||
    "";
  return { title, body };
}

export default async function AdminSellerDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

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

  const [
    clientsCount,
    totalResCountAgg,
    monthResCountAgg,
    resTotalByCurrency,
    resMonthByCurrency,
    tasksPendingCount,
    tasksOverdueCount,
    resByStatus,
    tasksByStatus,
    tasksByPriority,
    topDestGroupRaw,
    recentReservations,
    recentTasks,
    recentClients,
    // 👇 incluimos relaciones y metadata para formatear mejor
    recentActivity,
  ] = await Promise.all([
    prisma.client.count({ where: { sellerId: seller.id } }),
    prisma.reservation.aggregate({ where: { sellerId: seller.id }, _count: { _all: true } }),
    prisma.reservation.aggregate({ where: { sellerId: seller.id, startDate: { gte: start, lte: end } }, _count: { _all: true } }),
    prisma.reservation.groupBy({ where: { sellerId: seller.id }, by: ["currency"], _sum: { totalAmount: true }, _count: { _all: true } }),
    prisma.reservation.groupBy({
      where: { sellerId: seller.id, startDate: { gte: start, lte: end } },
      by: ["currency"],
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.task.count({ where: { sellerId: seller.id, status: { in: TASK_PENDING as any } } }),
    prisma.task.count({ where: { sellerId: seller.id, status: { in: TASK_PENDING as any }, dueDate: { lt: now } } }),
    prisma.reservation.groupBy({ where: { sellerId: seller.id }, by: ["status"], _count: { _all: true }, _sum: { totalAmount: true } }),
    prisma.task.groupBy({ where: { sellerId: seller.id }, by: ["status"], _count: { _all: true } }),
    prisma.task.groupBy({ where: { sellerId: seller.id }, by: ["priority"], _count: { _all: true } }),
    prisma.reservation.groupBy({ where: { sellerId: seller.id }, by: ["destinationId", "currency"], _count: { _all: true }, _sum: { totalAmount: true } }),
    prisma.reservation.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, code: true, status: true, startDate: true, endDate: true, totalAmount: true, currency: true, createdAt: true,
        client: { select: { name: true } },
        destination: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, priority: true, dueDate: true, createdAt: true },
    }),
    prisma.client.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.activityLog.findMany({
      where: { userId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        message: true,
        metadata: true,
        createdAt: true,
        // relaciones opcionales para enriquecer mensajes
        reservation: { select: { code: true } },
        client: { select: { name: true } },
      },
    }),
  ]);

  // Totales en USD
  const totalResCount = totalResCountAgg._count?._all ?? 0;
  const monthResCount = monthResCountAgg._count?._all ?? 0;
  const totalResSumUSD = resTotalByCurrency.reduce((acc, r) => acc + toUSD(Number(r._sum.totalAmount ?? 0), (r as any).currency), 0);
  const monthResSumUSD = resMonthByCurrency.reduce((acc, r) => acc + toUSD(Number(r._sum.totalAmount ?? 0), (r as any).currency), 0);
  const pendingResCount = resByStatus
    .filter((r) => (RES_PENDING as readonly string[]).includes(r.status))
    .reduce((acc, r) => acc + (r._count?._all ?? 0), 0);
  const avgTicketUSD = totalResCount > 0 ? totalResSumUSD / totalResCount : 0;
  const tenureDays = daysBetween(seller.createdAt, new Date());

  // Top destinos en USD
  const topDestUSDMap: Record<string, { count: number; sumUSD: number }> = {};
  for (const row of topDestGroupRaw) {
    const destId = row.destinationId as string;
    const usd = toUSD(Number(row._sum.totalAmount ?? 0), (row as any).currency);
    if (!topDestUSDMap[destId]) topDestUSDMap[destId] = { count: 0, sumUSD: 0 };
    topDestUSDMap[destId].count += row._count._all;
    topDestUSDMap[destId].sumUSD += usd;
  }
  const topDestSorted = Object.entries(topDestUSDMap)
    .map(([destinationId, v]) => ({ destinationId, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDestIds = topDestSorted.map((d) => d.destinationId);
  const topDestinationNames = topDestIds.length
    ? await prisma.destination.findMany({ where: { id: { in: topDestIds } }, select: { id: true, name: true } })
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
          <a href={`/dashboard-admin/usuarios/${seller.id}`} className="rounded-md border px-3 py-2 text-sm">Editar</a>
          <a href="/dashboard-admin/vendedores" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
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
          <div className="text-2xl font-semibold">{fmtMoney(avgTicketUSD, "USD")}</div>
          <div className="text-[11px] text-gray-500">en todas las reservas (USD)</div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Ventas (mes)</div>
          <div className="text-2xl font-semibold">{fmtMoney(monthResSumUSD, "USD")}</div>
          <div className="text-[11px] text-gray-500">{monthResCount} reservas (USD)</div>
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

                const amountUSD = toUSD(Number(r.totalAmount ?? 0), r.currency);

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
                        {fmtMoney(amountUSD, "USD")}
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
                    <span className="font-semibold">{d.count}</span>
                    <span className="text-gray-500">{fmtMoney(d.sumUSD, "USD")}</span>
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
              {recentActivity.map((a) => {
                const { title, body } = formatActivityEs(a);
                return (
                  <li key={a.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{title}</span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(a.createdAt).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    {body ? <div className="text-xs text-gray-700 whitespace-pre-wrap">{body}</div> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
