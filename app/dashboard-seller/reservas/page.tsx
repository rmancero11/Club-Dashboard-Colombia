import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { ReservationStatus } from "@prisma/client";

/* ================= Helpers ================= */
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
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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
function parseDayStart(s?: string | null) {
  if (!s) return undefined;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function parseDayEnd(s?: string | null) {
  if (!s) return undefined;
  const d = new Date(`${s}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/* ================= Estados en español ================= */
const STATUS_LIST = [
  { value: "LEAD" as const, label: "Prospecto" },
  { value: "QUOTED" as const, label: "Cotizado" },
  { value: "HOLD" as const, label: "Hold / Opción" },
  { value: "CONFIRMED" as const, label: "Confirmada" },
  { value: "TRAVELING" as const, label: "Viajando" },
  { value: "COMPLETED" as const, label: "Completada" },
  { value: "CANCELED" as const, label: "Cancelada" },
  { value: "EXPIRED" as const, label: "Expirada" },
] as const;

const STATUS_LABELS: Record<ReservationStatus, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  HOLD: "Hold / Opción",
  CONFIRMED: "Confirmada",
  TRAVELING: "Viajando",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
};

const ALLOWED_STATUS = new Set(STATUS_LIST.map((s) => s.value));

/* ================= Página ================= */
export default async function ReservasPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const isAdmin = auth.role === "ADMIN";
  const sellerId = auth.userId;

  /* ================= Query params ================= */
  const q =
    (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const statusRaw =
    (Array.isArray(searchParams.status)
      ? searchParams.status[0]
      : searchParams.status) ?? "";
  const status: ReservationStatus | "" = ALLOWED_STATUS.has(
    statusRaw as ReservationStatus
  )
    ? (statusRaw as ReservationStatus)
    : "";
  const destinationId =
    (Array.isArray(searchParams.destinationId)
      ? searchParams.destinationId[0]
      : searchParams.destinationId) ?? "";
  const dateFrom =
    (Array.isArray(searchParams.dateFrom)
      ? searchParams.dateFrom[0]
      : searchParams.dateFrom) ?? "";
  const dateTo =
    (Array.isArray(searchParams.dateTo)
      ? searchParams.dateTo[0]
      : searchParams.dateTo) ?? "";
  const page = toInt(searchParams.page, 1);
  const pageSizeRaw = toInt(searchParams.pageSize, 10);
  const pageSize = Math.min(pageSizeRaw, 50);

  /* ================= Filtros base ================= */
  const where: any = {};
  if (!isAdmin) where.sellerId = sellerId;
  if (status) where.status = status;
  if (destinationId) where.destinationId = destinationId;

  const gte = parseDayStart(dateFrom);
  const lte = parseDayEnd(dateTo);
  if (gte || lte)
    where.startDate = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };

  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { email: { contains: q, mode: "insensitive" } } },
      { destination: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  /* ================= Opciones de filtros ================= */
  const destinationsPromise = prisma.destination.findMany({
    where: { isActive: true },
    select: { id: true, name: true, country: true, city: true },
    orderBy: [{ name: "asc" }],
  });

  /* ================= Datos + total ================= */
  const [total, items, destinations] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        status: true,
        startDate: true,
        endDate: true,
        paxAdults: true,
        paxChildren: true,
        currency: true,
        totalAmount: true,
        client: { select: { id: true, name: true, email: true } },
        destination: { select: { id: true, name: true } },
        sellerId: true,
      },
    }),
    destinationsPromise,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    const qs = qstr({
      q,
      status,
      destinationId,
      dateFrom,
      dateTo,
      page: String(safePage),
      pageSize: String(pageSize),
    });
    redirect(`/dashboard-seller/reservas${qs}`);
  }

  /* ================= Render ================= */
  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservas</h1>
          <p className="text-sm text-gray-500">
            Crea y gestiona reservas. Mostrando {items.length} de{" "}
            {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <a
          href="/dashboard-seller/reservas/nueva"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Nueva reserva
        </a>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-4">
        <form
          className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-6"
          method="GET"
        >
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Código, cliente, destino..."
          />

          <select
            name="status"
            defaultValue={status}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Estado (todos)</option>
            {STATUS_LIST.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            name="destinationId"
            defaultValue={destinationId}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Destino (todos)</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.city ? `— ${d.city}` : ""} ({d.country})
              </option>
            ))}
          </select>

          <input
            type="date"
            name="dateFrom"
            defaultValue={dateFrom}
            className="rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="date"
            name="dateTo"
            defaultValue={dateTo}
            className="rounded-md border px-3 py-2 text-sm"
          />

          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n} / pág.
              </option>
            ))}
          </select>

          <input type="hidden" name="page" value="1" />

          <div className="col-span-1 sm:col-span-6 mt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              className="rounded-md border px-3 py-2 text-sm w-full sm:w-auto"
              type="submit"
            >
              Aplicar
            </button>
            <a
              className="rounded-md border px-3 py-2 text-sm w-full sm:w-auto text-center"
              href={`/dashboard-seller/reservas${qstr({
                page: "1",
                pageSize: String(pageSize),
              })}`}
            >
              Borrar filtros
            </a>
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Código</th>
              <th className="px-2 py-2">Cliente</th>
              <th className="px-2 py-2">Destino</th>
              <th className="px-2 py-2">Fechas</th>
              <th className="px-2 py-2">Pasajeros</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-10 text-center text-gray-400"
                >
                  Sin resultados
                </td>
              </tr>
            )}

            {items.map((r) => {
              const amount = Number(r.totalAmount);
              const statusClass =
                r.status === "CONFIRMED"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : r.status === "LEAD"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : r.status === "QUOTED"
                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                  : r.status === "HOLD"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : r.status === "TRAVELING"
                  ? "border-purple-200 bg-purple-50 text-purple-700"
                  : r.status === "COMPLETED"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : r.status === "CANCELED"
                  ? "border-gray-200 bg-gray-100 text-gray-600"
                  : r.status === "EXPIRED"
                  ? "border-stone-200 bg-stone-50 text-stone-700"
                  : "border-gray-200 bg-white text-gray-700";

              return (
                <tr key={r.id} className="border-t">
                  <td className="px-2 py-2 font-medium">{r.code}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      <span>{r.client?.name || "—"}</span>
                      {r.client?.email && (
                        <span className="text-xs text-gray-600">
                          {r.client.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2">{r.destination?.name || "—"}</td>
                  <td className="px-2 py-2">
                    {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                  </td>
                  <td className="px-2 py-2">
                    Adultos: {r.paxAdults} / Niños: {r.paxChildren}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-2 py-2">{fmtMoney(amount, r.currency)}</td>
                  <td className="px-2 py-2 text-right">
                    <a
                      href={`/dashboard-seller/reservas/${r.id}`}
                      className="text-primary underline"
                    >
                      Ver
                    </a>
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
          Página {page} de {totalPages} — Mostrando{" "}
          {items.length > 0
            ? `${(page - 1) * pageSize + 1}–${
                (page - 1) * pageSize + items.length
              }`
            : "0"}{" "}
          de {total.toLocaleString("es-CO")}
        </div>
        <div className="flex items-center gap-2">
          <a
            aria-disabled={page <= 1}
            className={`rounded-md border px-3 py-2 text-sm ${
              page <= 1 ? "pointer-events-none opacity-50" : ""
            }`}
            href={
              page > 1
                ? `/dashboard-seller/reservas${qstr({
                    q,
                    status,
                    destinationId,
                    dateFrom,
                    dateTo,
                    page: String(page - 1),
                    pageSize: String(pageSize),
                  })}`
                : "#"
            }
          >
            ← Anterior
          </a>
          <a
            aria-disabled={page >= totalPages}
            className={`rounded-md border px-3 py-2 text-sm ${
              page >= totalPages ? "pointer-events-none opacity-50" : ""
            }`}
            href={
              page < totalPages
                ? `/dashboard-seller/reservas${qstr({
                    q,
                    status,
                    destinationId,
                    dateFrom,
                    dateTo,
                    page: String(page + 1),
                    pageSize: String(pageSize),
                  })}`
                : "#"
            }
          >
            Siguiente → 
          </a>
        </div>
      </div>
    </div>
  );
}
