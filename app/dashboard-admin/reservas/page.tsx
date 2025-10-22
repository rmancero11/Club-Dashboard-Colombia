import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

function toInt(v: string | string[] | undefined, def: number) {
  const n = Array.isArray(v) ? parseInt(v[0] || "", 10) : parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function qstr(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

// Mapa de etiquetas en español (UI) para ReservationStatus
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
// Orden para KPIs y select
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
// Estilos de “píldora” por estado (solo UI)
const RES_PILL: Record<string, string> = {
  LEAD: "bg-gray-50 border-gray-200 text-gray-700",
  QUOTED: "bg-indigo-50 border-indigo-200 text-indigo-700",
  HOLD: "bg-amber-50 border-amber-200 text-amber-700",
  CONFIRMED: "bg-sky-50 border-sky-200 text-sky-700",
  TRAVELING: "bg-cyan-50 border-cyan-200 text-cyan-700",
  COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
  CANCELED: "bg-rose-50 border-rose-200 text-rose-700",
  EXPIRED: "bg-stone-50 border-stone-200 text-stone-700",
};

export default async function AdminReservationsPage({
  searchParams,
}: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const status = (Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) ?? ""; // "", LEAD, QUOTED...
  const sellerId = (Array.isArray(searchParams.sellerId) ? searchParams.sellerId[0] : searchParams.sellerId) ?? "";
  const destinationId = (Array.isArray(searchParams.destinationId) ? searchParams.destinationId[0] : searchParams.destinationId) ?? "";
  const month = (Array.isArray(searchParams.month) ? searchParams.month[0] : searchParams.month) ?? "";
  const page = toInt(searchParams.page, 1);
  const pageSize = Math.min(toInt(searchParams.pageSize, 10), 50);

  // rango de fechas por month (YYYY-MM)
  let dateFilter: { gte?: Date; lte?: Date } = {};
  if (month) {
    const [y, m] = month.split("-");
    const yy = parseInt(y || "", 10);
    const mm = parseInt(m || "", 10);
    if (Number.isFinite(yy) && Number.isFinite(mm) && mm >= 1 && mm <= 12) {
      const start = new Date(yy, mm - 1, 1, 0, 0, 0, 0);
      const end = new Date(yy, mm, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }
  }

  // whereBase: filtros comunes SIN el estado (para KPIs y sum global)
  const whereBase: Prisma.ReservationWhereInput = {};
  if (sellerId) whereBase.sellerId = sellerId;
  if (destinationId) whereBase.destinationId = destinationId;
  if (month && (dateFilter.gte || dateFilter.lte)) whereBase.startDate = dateFilter;

  if (q) {
    whereBase.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { client: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  // where: mismos filtros + estado (si viene)
  const where: Prisma.ReservationWhereInput = {
    ...whereBase,
    ...(status ? { status: status as any } : {}),
  };

  // opciones de filtros
  const [sellers, destinations] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.destination.findMany({
      where: { isActive: true },
      select: { id: true, name: true, country: true },
      orderBy: [{ popularityScore: "desc" }, { name: "asc" }],
    }),
  ]);

  // datos
  const [total, items, statusAgg, sumAgg] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, code: true, status: true, startDate: true, endDate: true,
        paxAdults: true, paxChildren: true, currency: true, totalAmount: true, createdAt: true,
        client: { select: { name: true } },
        destination: { select: { name: true, country: true } },
        seller: { select: { name: true } },
      },
    }),
    prisma.reservation.groupBy({
      where: whereBase,
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.reservation.aggregate({
      where: whereBase,
      _sum: { totalAmount: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) {
    redirect(
      `/dashboard-admin/reservas${qstr({
        q,
        status,
        sellerId,
        destinationId,
        month,
        page: String(totalPages),
        pageSize: String(pageSize),
      })}`,
    );
  }

  const statusMap = Object.fromEntries(statusAgg.map((s) => [s.status, s._count._all])) as Record<string, number>;
  const totalSum = Number(sumAgg._sum.totalAmount || 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservas</h1>
          <p className="text-sm text-gray-500">
            Mostrando {items.length} de {total.toLocaleString("es-CO")} · Monto global {money(totalSum)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard-admin/reservas/nueva" className="rounded-lg bg-black px-4 py-2 text-white">Nueva reserva</a>
        </div>
      </header>

      {/* KPIs por estado (enum real) */}
      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {RES_ORDER.map((s) => (
          <div key={s} className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">{RES_LABELS[s]}</div>
            <div className="text-xl font-semibold">{statusMap[s] || 0}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4">
        {/* Filtros */}
        <form className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-6" method="GET">
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Código de reserva o nombre del cliente…"
          />
          <select name="status" defaultValue={status} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Estado (todos)</option>
            {RES_ORDER.map((s) => (
              <option key={s} value={s}>{RES_LABELS[s]}</option>
            ))}
          </select>
          <select name="sellerId" defaultValue={sellerId} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Vendedor (todos)</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
          </select>
          <select name="destinationId" defaultValue={destinationId} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Destino (todos)</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}
          </select>
          <input type="month" name="month" defaultValue={month || undefined} className="rounded-md border px-3 py-2 text-sm" />
          <select name="pageSize" defaultValue={String(pageSize)} className="rounded-md border px-3 py-2 text-sm">
            {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n} / pág.</option>)}
          </select>
          <input type="hidden" name="page" value="1" />
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">Aplicar</button>
            {/* Borrar filtros */}
            <a
              className="rounded-md border px-3 py-2 text-sm"
              href={`/dashboard-admin/reservas${qstr({
                page: "1",
                pageSize: String(pageSize),
              })}`}
            >
              Borrar filtros
            </a>
          </div>
        </form>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Reserva</th>
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Destino</th>
                <th className="px-2 py-2">Vendedor</th>
                <th className="px-2 py-2">Fechas</th>
                <th className="px-2 py-2">PAX</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Total</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={9} className="px-2 py-10 text-center text-gray-400">Sin resultados</td></tr>
              )}
              {items.map((r) => {
                const pill = RES_PILL[r.status] || "bg-gray-50 border-gray-200 text-gray-700";
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-2">
                      <div className="font-medium">{r.code}</div>
                      <div className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString("es-CO")}</div>
                    </td>
                    <td className="px-2 py-2">{r.client?.name || "—"}</td>
                    <td className="px-2 py-2">{r.destination?.name || "—"}</td>
                    <td className="px-2 py-2">{r.seller?.name || "—"}</td>
                    <td className="px-2 py-2">
                      {new Date(r.startDate).toLocaleDateString("es-CO")} → {new Date(r.endDate).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-2 py-2">{r.paxAdults} / {r.paxChildren}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${pill}`}>
                        {RES_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">{money(Number(r.totalAmount), r.currency)}</td>
                    <td className="px-2 py-2 text-right">
                      <a href={`/dashboard-admin/reservas/${r.id}`} className="text-primary underline">Ver</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-xs text-gray-500">
            Página {page} de {totalPages} — Mostrando {items.length > 0 ? `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + items.length}` : "0"} de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              href={page > 1 ? `/dashboard-admin/reservas${qstr({ q, status, sellerId, destinationId, month, page: String(page - 1), pageSize: String(pageSize) })}` : "#"}
            >← Anterior</a>
            <a
              aria-disabled={page >= totalPages}
              className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              href={page < totalPages ? `/dashboard-admin/reservas${qstr({ q, status, sellerId, destinationId, month, page: String(page + 1), pageSize: String(pageSize) })}` : "#"}
            >Siguiente →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
