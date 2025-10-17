import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

// Desactiva caché para ver cambios de documentos al instante
export const revalidate = 0; // opcional: export const dynamic = "force-dynamic";

// --- Helpers de querystring/paginación ---
function toInt(v: string | string[] | undefined, def: number) {
  const n = Array.isArray(v) ? parseInt(v[0] || "", 10) : parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function qstr(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && usp.set(k, v));
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

// --- Indicativos por país (amplía según mercados) ---
const DIAL_BY_COUNTRY: Record<string, string> = {
  // Américas
  Colombia: "57",
  México: "52",
  "Estados Unidos": "1",
  "United States": "1",
  Canadá: "1",
  Canada: "1",
  Perú: "51",
  Chile: "56",
  Argentina: "54",
  Ecuador: "593",
  Venezuela: "58",
  Brasil: "55",
  // Europa
  España: "34",
  Portugal: "351",
  Francia: "33",
  Italia: "39",
  Alemania: "49",
};

function dialCodeForCountry(country?: string) {
  if (!country) return "";
  return DIAL_BY_COUNTRY[country.trim()] ?? "";
}
function normalizePhone(raw?: string) {
  return (raw || "").replace(/[^\d+]/g, "");
}
function digitsOnly(raw?: string) {
  return (raw || "").replace(/\D/g, "");
}
function toE164(phone?: string, country?: string) {
  const raw = normalizePhone(phone);
  if (!raw) return "";
  if (raw.startsWith("+")) return `+${digitsOnly(raw)}`;
  const dial = dialCodeForCountry(country);
  const localDigits = digitsOnly(raw);
  if (!localDigits) return "";
  return dial ? `+${dial}${localDigits}` : `+${localDigits}`;
}
function waLink(e164?: string) {
  const d = digitsOnly(e164);
  return d ? `https://wa.me/${d}` : "";
}

// === Mapeo de estados de reserva (schema.prisma) ===
const RES_STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  QUOTED: "Cotizada",
  HOLD: "En hold",
  CONFIRMED: "Confirmada",
  TRAVELING: "Viajando",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
};
function resStatusBadgeClass(status?: string) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "TRAVELING":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "COMPLETED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "CANCELED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "EXPIRED":
      return "border-stone-200 bg-stone-50 text-stone-700";
    case "QUOTED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "HOLD":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "LEAD":
      return "border-gray-200 bg-gray-50 text-gray-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

// === Etiquetas y render de Documentos ===
const FILE_LABELS: Record<string, string> = {
  purchaseOrder: "Orden de compra",
  flightTickets: "Boletos de vuelo",
  serviceVoucher: "Voucher de servicio",
  medicalAssistanceCard: "Asistencia médica",
  travelTips: "Tips de viaje",
};

function DocList({ user }: { user?: Record<string, unknown> | null }) {
  const entries = Object.entries(user || {}).filter(
    ([, url]) => typeof url === "string" && url
  ) as Array<[string, string]>;

  if (entries.length === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <ul className="mt-1 flex flex-col gap-1">
      {entries.map(([key, url]) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-gray-700"
            title="Abrir documento en una nueva pestaña"
          >
            {FILE_LABELS[key] || key}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function SellerClientsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if ((auth.role !== "SELLER" && auth.role !== "ADMIN") || !auth.businessId) {
    redirect("/unauthorized");
  }

  const businessId = auth.businessId!;
  const sellerId = auth.userId; // 👈 Solo clientes del vendedor autenticado

  // --- Filtros desde la URL ---
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const status =
    (Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) ?? ""; // "", "active", "archived"
  const page = toInt(searchParams.page, 1);
  const pageSize = Math.min(toInt(searchParams.pageSize, 10), 50);

  // --- WHERE principal ---
  const where: any = { businessId, sellerId };
  if (status === "active") where.isArchived = false;
  if (status === "archived") where.isArchived = true;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { documentId: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  // --- Query principal: total + items (con conteo y última reserva) ---
  const [total, items] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        documentId: true,
        isArchived: true,
        createdAt: true,
        tags: true,
        _count: { select: { reservations: true } },
        reservations: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        // 👇 Asegura traer documentos del usuario
        user: {
          select: {
            purchaseOrder: true,
            flightTickets: true,
            serviceVoucher: true,
            medicalAssistanceCard: true,
            travelTips: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    redirect(
      `/dashboard-seller/clientes${qstr({
        q,
        status,
        page: String(safePage),
        pageSize: String(pageSize),
      })}`
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
        </div>
        <a href="/dashboard-seller/clientes/nuevo" className="rounded-lg bg-black px-4 py-2 text-white">
          Nuevo cliente
        </a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        {/* Filtros (GET) */}
        <form className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-5" method="GET">
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre, email, teléfono, ciudad…"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="archived">Archivados</option>
          </select>
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
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">
              Aplicar
            </button>
            <a
              className="rounded-md border px-3 py-2 text-sm"
              href={`/dashboard-seller/clientes${qstr({
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
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Teléfono / WhatsApp</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="px-2 py-2">Reservas</th>
                <th className="px-2 py-2">Estado (última reserva)</th>
                <th className="px-2 py-2">Documentos</th>
                <th className="px-2 py-2">Creado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-2 py-10 text-center text-gray-400">
                    Sin resultados
                  </td>
                </tr>
              )}

              {items.map((c) => {
                const e164 = toE164(c.phone || "", c.country || "");
                const wa = waLink(e164);
                const lastRes = c.reservations?.[0];
                const lastStatus = lastRes?.status as keyof typeof RES_STATUS_LABEL | undefined;
                const lastStatusLabel = lastStatus ? RES_STATUS_LABEL[lastStatus] : "—";
                const badgeCls = resStatusBadgeClass(lastStatus);

                const docCount = Object.values(c.user || {}).filter(Boolean).length;

                return (
                  <tr key={c.id} className="border-t">
                    {/* Cliente + tags */}
                    <td className="px-2 py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(c.tags || []).map((t) => (
                          <span
                            key={t}
                            className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-2 py-2">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="text-xs text-blue-600 underline">
                          {c.email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Teléfono / WhatsApp */}
                    <td className="px-2 py-2">
                      {e164 ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-700 underline"
                          title="Abrir WhatsApp"
                        >
                          {e164}
                        </a>
                      ) : c.phone ? (
                        <span className="text-xs text-gray-600">{c.phone}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Ubicación */}
                    <td className="px-2 py-2">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>

                    {/* Conteo de reservas */}
                    <td className="px-2 py-2">{c._count.reservations}</td>

                    {/* Estado última reserva */}
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${badgeCls}`}>
                        {lastStatusLabel}
                      </span>
                    </td>

                    {/* Documentos */}
                    <td className="px-2 py-2">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          {docCount > 0 ? `Ver archivos (${docCount})` : "Ver archivos"}
                        </summary>
                        <DocList user={c.user as any} />
                      </details>
                    </td>

                    {/* Creado */}
                    <td className="px-2 py-2">{fmtDate(c.createdAt)}</td>

                    {/* Acciones */}
                    <td className="px-2 py-2 text-right">
                      <a
                        href={`/dashboard-seller/clientes/${c.id}`}
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
              ? `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + items.length}`
              : "0"}{" "}
            de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              href={
                page > 1
                  ? `/dashboard-seller/clientes${qstr({
                      q,
                      status,
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
              className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              href={
                page < totalPages
                  ? `/dashboard-seller/clientes${qstr({
                      q,
                      status,
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
    </div>
  );
}
