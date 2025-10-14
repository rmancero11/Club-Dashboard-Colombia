import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

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

// --- Indicativos por país (amplía según tus mercados) ---
const DIAL_BY_COUNTRY: Record<string, string> = {
  // Américas
  "Colombia": "57",
  "México": "52",
  "Estados Unidos": "1",
  "United States": "1",
  "Canadá": "1",
  "Canada": "1",
  "Perú": "51",
  "Chile": "56",
  "Argentina": "54",
  "Ecuador": "593",
  "Venezuela": "58",
  "Brasil": "55",
  // Europa
  "España": "34",
  "Portugal": "351",
  "Francia": "33",
  "Italia": "39",
  "Alemania": "49",
};

function dialCodeForCountry(country?: string) {
  if (!country) return "";
  return DIAL_BY_COUNTRY[country.trim()] ?? "";
}
function normalizePhone(raw?: string) {
  return (raw || "").replace(/[^\d+]/g, ""); // deja + y dígitos
}
function digitsOnly(raw?: string) {
  return (raw || "").replace(/\D/g, "");
}
function toE164(phone?: string, country?: string) {
  const raw = normalizePhone(phone);
  if (!raw) return "";
  if (raw.startsWith("+")) return `+${digitsOnly(raw)}`; // ya viene con +
  const dial = dialCodeForCountry(country);
  const localDigits = digitsOnly(raw);
  if (!localDigits) return "";
  return dial ? `+${dial}${localDigits}` : `+${localDigits}`; // fallback sin país
}
function waLink(e164?: string) {
  const d = digitsOnly(e164);
  return d ? `https://wa.me/${d}` : "";
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");
  const businessId = auth.businessId!;

  // --- Query params ---
  const q =
    (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const sellerId =
    (Array.isArray(searchParams.sellerId)
      ? searchParams.sellerId[0]
      : searchParams.sellerId) ?? "";
  const archived =
    (Array.isArray(searchParams.archived)
      ? searchParams.archived[0]
      : searchParams.archived) ?? ""; // "", active, archived
  const country =
    (Array.isArray(searchParams.country)
      ? searchParams.country[0]
      : searchParams.country) ?? "";
  const page = toInt(searchParams.page, 1);
  const pageSize = Math.min(toInt(searchParams.pageSize, 10), 50);

  // --- Filtro principal: solo nombre y correo ---
  const where: any = { businessId };
  if (sellerId) where.sellerId = sellerId;
  if (archived === "active") where.isArchived = false;
  if (archived === "archived") where.isArchived = true;
  if (country) where.country = country;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  // Filtros auxiliares (para selects)
  const [sellers, countries] = await Promise.all([
    prisma.user.findMany({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }],
    }),
    prisma.client.findMany({
      where: { businessId },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
  ]);
  const countryOpts = (countries.map((c) => c.country).filter(Boolean) ||
    []) as string[];

  // Traer clientes
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
        seller: { select: { id: true, name: true } },
        _count: { select: { reservations: true } },
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
      `/dashboard-admin/clientes${qstr({
        q,
        sellerId,
        archived,
        country,
        page: String(safePage),
        pageSize: String(pageSize),
      })}`
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-500">
            Mostrando {items.length} de {total.toLocaleString("es-CO")}.
          </p>
        </div>
      </header>

      <div className="rounded-xl border bg-white p-4">
        {/* Filtros */}
        <form
          className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-6"
          method="GET"
        >
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre o correo…"
          />
          <select
            name="sellerId"
            defaultValue={sellerId}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Vendedor (todos)</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
          {/* País solo por desplegable */}
          <select
            name="country"
            defaultValue={country}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">País (todos)</option>
            {countryOpts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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
            {/* Botón borrar filtros */}
            <a
              className="rounded-md border px-3 py-2 text-sm"
              href={`/dashboard-admin/clientes${qstr({
                page: "1",
                pageSize: String(pageSize),
              })}`}
            >
              Borrar filtros
            </a>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Teléfono / WhatsApp</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="px-2 py-2">Vendedor</th>
                <th className="px-2 py-2">Reservas</th>
                <th className="px-2 py-2">Documentos</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-2 py-10 text-center text-gray-400"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
              {items.map((c) => {
                const e164 = toE164(c.phone || "", c.country || "");
                const wa = waLink(e164);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-2 py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-600">
                        Creado: {fmtDate(c.createdAt)}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.tags?.map((t) => (
                          <span
                            key={t}
                            className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Email separado */}
                    <td className="px-2 py-2">
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-xs text-blue-600 underline"
                        >
                          {c.email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Teléfono con indicativo y link a WhatsApp */}
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
                        <span className="text-xs text-gray-600">
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-2 py-2">{c.seller?.name || "—"}</td>
                    <td className="px-2 py-2">{c._count.reservations}</td>

                    {/* Documentos */}
                    <td className="px-2 py-2">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          Ver archivos
                        </summary>
                        <div className="mt-1 flex flex-col gap-1">
                          {Object.entries(c.user || {}).map(([key, url]) =>
                            url ? (
                              <a
                                key={key}
                                href={url as string}
                                target="_blank"
                                className="text-xs underline text-gray-700"
                              >
                                {key}
                              </a>
                            ) : null
                          )}
                        </div>
                      </details>
                    </td>

                    <td className="px-2 py-2 text-right">
                      <div className="flex gap-2">
                        <a
                          href={`/dashboard-admin/clientes/${c.id}`}
                          className="text-primary underline"
                        >
                          Ver
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
                  ? `/dashboard-admin/clientes${qstr({
                      q,
                      sellerId,
                      archived,
                      country,
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
                  ? `/dashboard-admin/clientes${qstr({
                      q,
                      sellerId,
                      archived,
                      country,
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
