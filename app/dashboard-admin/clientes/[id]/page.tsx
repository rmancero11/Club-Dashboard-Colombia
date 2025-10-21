export const revalidate = 0;

import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminClientEditForm from "@/app/components/admin/AdminClientEditform";
import ClientDocuments from "@/app/components/admin/ClientDocuments";

/** Utils */
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO");
}
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    const val = Number.isFinite(n) ? n.toFixed(2) : String(n);
    return `${currency} ${val}`;
  }
}

/** Etiquetas legibles para archivos (WHITELIST, igual que seller) */
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
const ALLOWED_DOC_FIELDS = Object.keys(FILE_LABELS) as (keyof typeof FILE_LABELS)[];

/** Detección de extensión (tolerante con URLs sin .ext) */
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
const isImg = (e: string) => ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(e);
const isPdf = (e: string) => e === "pdf";
const isVid = (e: string) => ["mp4", "webm", "ogg"].includes(e);

/** Helpers Cloudinary + proxy (igual que seller) */
function isCloudinary(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
function injectCloudinaryFlag(url: string, flag: string) {
  if (url.includes("/raw/upload/")) return url.replace("/raw/upload/", `/raw/upload/${flag}/`);
  if (url.includes("/upload/")) return url.replace("/upload/", `/upload/${flag}/`);
  return url;
}
function toInlineCloudinary(url: string) {
  return injectCloudinaryFlag(url, "fl_inline");
}
function ensurePdfExt(url: string) {
  return /\.pdf(\?|#|$)/i.test(url) ? url : `${url}.pdf`;
}
function filenameForKey(key: string) {
  switch (key) {
    case "dniFile": return "documento_identidad.pdf";
    case "passport": return "pasaporte.pdf";
    case "visa": return "visa.pdf";
    case "purchaseOrder": return "orden_compra.pdf";
    case "flightTickets": return "boletos_vuelo.pdf";
    case "serviceVoucher": return "voucher_servicio.pdf";
    case "medicalAssistanceCard": return "asistencia_medica.pdf";
    case "travelTips": return "tips_viaje.pdf";
    default: return "documento.pdf";
  }
}

/** Previsualizador (mismo comportamiento que seller: iframe + file-proxy) */
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

  // PDF (o Cloudinary raw sin extensión)
  const looksPdf =
    isPdf(ext) || (isCloudinary(url) && (url.includes("/raw/upload/") || url.includes("/upload/")));

  if (looksPdf) {
    const filename = filenameForKey(fileKey || "document");
    const src = url.includes("/api/file-proxy")
      ? url // ya viene listo
      : `/api/file-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    const downloadHref = src;

    return (
      <div className="rounded-md border p-2 overflow-auto">
        <iframe src={src} title={filename} className="h-80 w-full rounded" />
        <div className="mt-2 flex gap-2">
          <a href={downloadHref} download={filename} className="text-xs underline" title="Descargar PDF">
            Descargar
          </a>
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs underline" title="Abrir en pestaña">
            Abrir en pestaña
          </a>
        </div>
      </div>
    );
  }

  // Fallback genérico
  return (
    <div className="rounded-md border p-3 text-xs text-gray-600">
      <div className="mb-2">No se puede previsualizar este tipo de archivo.</div>
      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-md border px-2 py-1 underline">
          Abrir
        </a>
        <a href={url} download className="rounded-md border px-2 py-1">
          Descargar
        </a>
      </div>
    </div>
  );
}

/** Lista de documentos (igual que seller) */
function DocumentList({ user }: { user?: Record<string, unknown> | null }) {
  if (!user) return <div className="text-xs text-gray-400">No hay documentos</div>;

  const entries: { key: string; label: string; url: string }[] = [];
  for (const key of ALLOWED_DOC_FIELDS) {
    const v = user[key as string];
    if (typeof v === "string" && v.trim()) entries.push({ key, label: FILE_LABELS[key], url: v.trim() });
  }

  if (entries.length === 0) return <div className="text-xs text-gray-400">No hay documentos</div>;

  return (
    <ul className="flex flex-col gap-2">
      {entries.map(({ key, label, url }) => {
        const filename = filenameForKey(key);
        const openUrl = isCloudinary(url)
          ? `/api/file-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
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

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const client = await prisma.client.findFirst({
    where: { id: params.id, businessId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      documentId: true,
      birthDate: true,
      tags: true,
      notes: true,
      isArchived: true,
      createdAt: true,
      seller: { select: { id: true, name: true, email: true } },
      _count: { select: { reservations: true } },
      // Documentos del USER (igual que seller)
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
  });
  if (!client) notFound();

  const [reservations, sellers] = await Promise.all([
    prisma.reservation.findMany({
      where: { businessId, clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        code: true,
        status: true,
        startDate: true,
        endDate: true,
        currency: true,
        totalAmount: true,
        destination: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {client.email || "—"} · {client.phone || "—"} · {client.city ? `${client.city}, ` : ""}{client.country || "—"}
          </p>
        </div>
        <a href="/dashboard-admin/clientes" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información del cliente + Documentos con previsualización */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Información</h2>
          <div className="grid gap-1 text-sm">
            <div>
              <span className="text-gray-500">Documento: </span>
              {client.documentId || "—"}
            </div>
            <div>
              <span className="text-gray-500">Nacimiento: </span>
              {client.birthDate ? fmtDate(client.birthDate) : "—"}
            </div>
            <div>
              <span className="text-gray-500">Vendedor: </span>
              {client.seller?.name || "—"}
            </div>
            <div>
              <span className="text-gray-500">Reservas: </span>
              {client._count.reservations}
            </div>
            <div>
              <span className="text-gray-500">Estado: </span>
              {client.isArchived ? "Archivado" : "Activo"}
            </div>

            <div className="mt-2">
              <div className="text-gray-500">Tags:</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {client.tags?.length
                  ? client.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600"
                      >
                        {t}
                      </span>
                    ))
                  : "—"}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-gray-500">Notas:</div>
              <div className="whitespace-pre-wrap">{client.notes || "—"}</div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Creado: {fmtDate(client.createdAt)}
            </div>

            {/* Documentos (misma UX que seller) */}
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Documentos</h3>
              <details className="group">
                <summary className="cursor-pointer text-sm text-blue-600">
                  Ver archivos
                </summary>
                <div className="mt-2">
                  <ClientDocuments initialUser={client.user as any} />
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Formulario de edición (admin) */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Editar</h2>
          <AdminClientEditForm
            clientId={client.id}
            currentSellerId={client.seller?.id || ""}
            currentArchived={client.isArchived}
            currentNotes={client.notes || ""}
            sellers={sellers}
          />
        </div>
      </div>

      {/* Reservas recientes (solo lectura) */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Reservas recientes</h2>
        {reservations.length === 0 ? (
          <div className="text-gray-400">Sin reservas</div>
        ) : (
          <ul className="divide-y">
            {reservations.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {r.destination?.name || "—"} · {r.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.startDate).toLocaleDateString("es-CO")} →{" "}
                      {new Date(r.endDate).toLocaleDateString("es-CO")} · {r.status}
                    </div>
                  </div>
                  <div className="text-sm">{money(Number(r.totalAmount), r.currency)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
