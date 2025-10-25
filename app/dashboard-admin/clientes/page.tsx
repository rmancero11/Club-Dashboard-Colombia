import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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

/* ================================
   Documentos (idéntico al seller)
================================== */
const FILE_LABELS: Record<string, string> = {
  // Identidad / viaje
  dniFile: "Documento de identidad",
  passport: "Pasaporte",
  visa: "Visa",
  // Operativa
  purchaseOrder: "Orden de compra",
  flightTickets: "Boletos de vuelo",
  serviceVoucher: "Voucher de servicio",
  medicalAssistanceCard: "Asistencia médica",
  travelTips: "Tips de viaje",
};
const ALLOWED_DOC_FIELDS = Object.keys(
  FILE_LABELS
) as (keyof typeof FILE_LABELS)[];

function getExt(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const qext = (u.searchParams.get("ext") || "").toLowerCase();
    const m = path.match(/\.([a-z0-9]+)$/i);
    return (qext || (m ? m[1] : "")).replace(/[^a-z0-9]/g, "");
  } catch {
    const m = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/i);
    return m ? m[1] : "";
  }
}
const isImg = (e: string) =>
  ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(e);
const isPdf = (e: string) => e === "pdf";
const isVid = (e: string) => ["mp4", "webm", "ogg"].includes(e);

function isCloudinary(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
function injectCloudinaryFlag(url: string, flag: string) {
  if (url.includes("/raw/upload/"))
    return url.replace("/raw/upload/", `/raw/upload/${flag}/`);
  if (url.includes("/upload/"))
    return url.replace("/upload/", `/upload/${flag}/`);
  return url;
}
function filenameForKey(key: string) {
  switch (key) {
    case "dniFile":
      return "documento_identidad.pdf";
    case "passport":
      return "pasaporte.pdf";
    case "visa":
      return "visa.pdf";
    case "purchaseOrder":
      return "orden_compra.pdf";
    case "flightTickets":
      return "boletos_vuelo.pdf";
    case "serviceVoucher":
      return "voucher_servicio.pdf";
    case "medicalAssistanceCard":
      return "asistencia_medica.pdf";
    case "travelTips":
      return "tips_viaje.pdf";
    default:
      return "documento.pdf";
  }
}

/** Previsualizador (igual al seller) */
function FilePreview({ url, fileKey }: { url: string; fileKey?: string }) {
  const ext = getExt(url);

  // IMAGEN
  if (isImg(ext)) {
    return (
      <div className="rounded-md border p-2">
        <img
          src={url}
          alt="Documento"
          loading="lazy"
          className="max-h-72 w-auto rounded"
          style={{ objectFit: "contain" }}
        />
      </div>
    );
  }

  // VIDEO
  if (isVid(ext)) {
    return (
      <div className="rounded-md border p-2">
        <video src={url} controls className="h-80 w-full rounded" />
      </div>
    );
  }

  // PDF o Cloudinary sin extensión
  const looksPdf =
    isPdf(ext) ||
    (isCloudinary(url) &&
      (url.includes("/raw/upload/") || url.includes("/upload/")));

  if (looksPdf) {
    const filename = filenameForKey(fileKey || "document");
    const src = url.includes("/api/file-proxy")
      ? url
      : `/api/file-proxy?url=${encodeURIComponent(
          url
        )}&filename=${encodeURIComponent(filename)}`;

    return (
      <div className="rounded-md border p-2 overflow-auto">
        <embed src={src} title={filename} className="h-80 w-full rounded" />
        <div className="mt-2 flex gap-2">
          <a
            href={src}
            download={filename}
            className="text-xs underline"
            title="Descargar PDF"
          >
            Descargar
          </a>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            title="Abrir en pestaña"
          >
            Abrir en pestaña
          </a>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="rounded-md border p-3 text-xs text-gray-600">
      <div className="mb-2">
        No se puede previsualizar este tipo de archivo.
      </div>
      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border px-2 py-1 underline"
        >
          Abrir
        </a>
        <a href={url} download className="rounded-md border px-2 py-1">
          Descargar
        </a>
      </div>
    </div>
  );
}

/** Lista de documentos (idéntica a la de seller) */
function DocumentList({ user }: { user?: Record<string, unknown> | null }) {
  if (!user)
    return <div className="text-xs text-gray-400">No hay documentos</div>;

  const entries: { key: string; label: string; url: string }[] = [];
  for (const key of ALLOWED_DOC_FIELDS) {
    const v = (user as any)[key as string];
    if (typeof v === "string" && v.trim()) {
      entries.push({ key, label: FILE_LABELS[key], url: v.trim() });
    }
  }

  if (entries.length === 0) {
    return <div className="text-xs text-gray-400">No hay documentos</div>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map(({ key, label, url }) => {
        const filename = filenameForKey(key);
        const openUrl = isCloudinary(url)
          ? `/api/file-proxy?url=${encodeURIComponent(
              url
            )}&filename=${encodeURIComponent(filename)}`
          : url;
        const downloadUrl = openUrl;

        return (
          <li key={key} className="rounded-md border p-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-gray-700">{label}</div>
              <div className="flex items-center gap-2">
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-700 underline"
                  title="Abrir en nueva pestaña"
                >
                  Abrir
                </a>
                <a
                  href={downloadUrl}
                  download={filename}
                  className="text-xs text-gray-700 underline"
                  title="Descargar"
                >
                  Descargar
                </a>
              </div>
            </div>

            <details className="mt-2 group">
              <summary className="cursor-pointer select-none text-xs text-gray-600 underline">
                Previsualizar
              </summary>
              <div className="mt-2">
                <FilePreview url={url} fileKey={key} />
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

/* ================================
   Página: AdminClientsPage
================================== */
export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  // Nuevo schema: sin businessId; solo validamos rol ADMIN
  if (auth.role !== "ADMIN") redirect("/unauthorized");

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
  const where: any = {};
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
      where: { role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }],
    }),
    prisma.client.findMany({
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
  ]);
  const countryOpts = (countries.map((c) => c.country).filter(Boolean) ||
    []) as string[];

  // Traer clientes (incluye última reserva por createdAt)
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
        // Última reserva (para mostrar estado del cliente)
        reservations: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        // Documentos (idéntico al seller)
        user: {
          select: {
            dniFile: true,
            passport: true,
            visa: true,
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
        <Link
          href="/dashboard-admin/clientes/nuevo"
          className="inline-flex items-center justify-center rounded-md bg-fuchsia-700 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-fuchsia-800 transition-colors"
        >
          + Nuevo cliente
        </Link>
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
            <button
              className="rounded-md border px-3 py-2 text-sm"
              type="submit"
            >
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
                <th className="px-2 py-2">Estado (última reserva)</th>
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
                const lastRes = c.reservations?.[0];
                const lastStatus = lastRes?.status as
                  | keyof typeof RES_STATUS_LABEL
                  | undefined;
                const lastStatusLabel = lastStatus
                  ? RES_STATUS_LABEL[lastStatus]
                  : "—";
                const badgeCls = resStatusBadgeClass(lastStatus);

                const docCount = Object.values((c as any).user || {}).filter(
                  Boolean
                ).length;

                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-2 py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-600">
                        Creado: {fmtDate(c.createdAt as any)}
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

                    {/* Email */}
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
                    <td className="px-2 py-2">
                      {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                    </td>

                    {/* Vendedor */}
                    <td className="px-2 py-2">{c.seller?.name || "—"}</td>

                    {/* Conteo de reservas */}
                    <td className="px-2 py-2">
                      {(c as any)._count.reservations}
                    </td>

                    {/* Estado última reserva */}
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${badgeCls}`}
                      >
                        {lastStatusLabel}
                      </span>
                    </td>

                    {/* Documentos (misma UX que seller) */}
                    <td className="px-2 py-2">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          {docCount > 0
                            ? `Ver archivos (${docCount})`
                            : "Ver archivos"}
                        </summary>
                        <div className="mt-2 max-w-full">
                          <DocumentList user={(c as any).user as any} />
                        </div>
                      </details>
                    </td>

                    {/* Acciones */}
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
