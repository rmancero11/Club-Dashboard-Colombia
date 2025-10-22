/* eslint-disable @next/next/no-img-element */
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { notFound, redirect } from "next/navigation";
import SellerClientDocumentsForm from "@/app/components/seller/SellerClientDocumentsform";
import Link from "next/link";

/** Utils */
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO");
}
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    const val = Number.isFinite(n) ? n.toFixed(2) : String(n);
    return `${currency} ${val}`;
  }
}

/** Etiquetas legibles para archivos (WHITELIST) */
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

/** Reserva (schema.prisma) */
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

/** Helpers específicos para Cloudinary + proxy */
function isCloudinary(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

/** Inserta flag de entrega en Cloudinary (soporta /upload y /raw/upload) */
function injectCloudinaryFlag(url: string, flag: string) {
  if (url.includes("/raw/upload/"))
    return url.replace("/raw/upload/", `/raw/upload/${flag}/`);
  if (url.includes("/upload/"))
    return url.replace("/upload/", `/upload/${flag}/`);
  return url;
}

/** Fuerza inline para visualizar PDF */
function toInlineCloudinary(url: string) {
  return injectCloudinaryFlag(url, "fl_inline");
}

/** Asegura que la URL termine en .pdf (útil para raw sin extensión) */
function ensurePdfExt(url: string) {
  return /\.pdf(\?|#|$)/i.test(url) ? url : `${url}.pdf`;
}

/** Construye un nombre de archivo amigable según la key */
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

/** Genera URL de descarga con filename en Cloudinary (fl_attachment:nombre.pdf) */
function toDownloadCloudinary(url: string, filename: string) {
  const encoded = `fl_attachment:${encodeURIComponent(filename)}`;
  return injectCloudinaryFlag(url, encoded);
}

/** Componente de previsualización (con PDF robusto) */
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
      ? url // ya viene listo (pid/rt/type/fmt)
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

  // Fallback genérico (doc/docx/xlsx o tipos no embebibles)
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

/** Lista de documentos con preview + acciones */
function DocumentList({ user }: { user?: Record<string, unknown> | null }) {
  if (!user) return <div className="text-xs text-gray-400">No hay documentos</div>;

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
        // Links “Abrir / Descargar” con manejo especial para Cloudinary PDF
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
                <a href={downloadUrl} download={filename} className="text-xs text-gray-700 underline" title="Descargar">
                  Descargar
                </a>
              </div>
            </div>

            <details className="mt-2 group">
              <summary className="cursor-pointer select-none text-xs text-gray-600 underline">Previsualizar</summary>
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

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  if (auth.role !== "SELLER") redirect("/unauthorized");

  const where: any = { id: params.id, sellerId: auth.userId };

  const client = await prisma.client.findFirst({
    where,
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
      reservations: {
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
      },
    },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {client.email || "—"} · {client.phone || "—"} ·{" "}
            {client.city ? `${client.city}, ` : ""}
            {client.country || "—"}
          </p>
        </div>
        <a href="/dashboard-seller/clientes" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      {/* Información + Documentos (edición por seller) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información del cliente */}
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
                      <span key={t} className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600">
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

            <div className="text-xs text-gray-500 mt-2">Creado: {fmtDate(client.createdAt)}</div>

            {/* Listado de archivos (preview + acciones) */}
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Documentos</h3>
              <details className="group">
                <summary className="cursor-pointer text-sm text-blue-600">Ver archivos</summary>
                <div className="mt-2">
                  <DocumentList user={client.user as any} />
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Formulario de documentos (edición por el seller) */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Documentos del cliente</h2>
          <SellerClientDocumentsForm
            clientId={client.id}
            current={{
              purchaseOrder: client.user?.purchaseOrder ?? null,
              flightTickets: client.user?.flightTickets ?? null,
              serviceVoucher: client.user?.serviceVoucher ?? null,
              medicalAssistanceCard: client.user?.medicalAssistanceCard ?? null,
              travelTips: client.user?.travelTips ?? null,
            }}
          />
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Acciones</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href={`/dashboard-seller/reservas/nueva?clientId=${client.id}`} className="rounded-md bg-black px-3 py-2 text-white">
            Crear reserva
          </a>
          <a href={`/dashboard-seller/tareas/nueva?clientId=${client.id}`} className="rounded-md border px-3 py-2">
            Crear tarea
          </a>
        </div>
      </div>

      {/* Reservas recientes */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Reservas recientes</h2>
        {client.reservations.length === 0 ? (
          <div className="text-gray-400">Sin reservas</div>
        ) : (
          <ul className="divide-y">
            {client.reservations.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {r.destination?.name || "—"} · {r.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.startDate).toLocaleDateString("es-CO")} →{" "}
                      {new Date(r.endDate).toLocaleDateString("es-CO")} ·{" "}
                      {RES_STATUS_LABEL[r.status as keyof typeof RES_STATUS_LABEL] ?? r.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">{money(Number(r.totalAmount), r.currency)}</div>
                    <Link className="text-sm text-primary underline" href={`/dashboard-seller/reservas/${r.id}`}>
                      Ver
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
