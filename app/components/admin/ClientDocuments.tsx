"use client";

import { useEffect, useMemo, useState } from "react";

/** Etiquetas legibles para archivos (WHITELIST, igual que seller) */
const FILE_LABELS: Record<string, string> = {
  dniFile: "Documento de identidad",
  passport: "Pasaporte",
  visa: "Visa",
  purchaseOrder: "Orden de compra",
  flightTickets: "Boletos de vuelo",
  serviceVoucher: "Voucher de servicio",
  medicalAssistanceCard: "Asistencia médica",
  travelTips: "Tips de viaje",
};
const ALLOWED_DOC_FIELDS = Object.keys(FILE_LABELS) as (keyof typeof FILE_LABELS)[];

/** Utils (copiados del server file) */
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

function isCloudinary(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
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

function FilePreview({ url, fileKey }: { url: string; fileKey?: string }) {
  const ext = getExt(url);

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

  if (isVid(ext)) {
    return (
      <div className="rounded-md border p-2">
        <video src={url} controls className="h-80 w-full rounded" />
      </div>
    );
  }

  const looksPdf =
    isPdf(ext) || (isCloudinary(url) && (url.includes("/raw/upload/") || url.includes("/upload/")));

  if (looksPdf) {
    const filename = filenameForKey(fileKey || "document");
    const src = url.includes("/api/file-proxy")
      ? url
      : `/api/file-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    return (
      <div className="rounded-md border p-2 overflow-auto">
        <iframe src={src} title={filename} className="h-80 w-full rounded" />
        <div className="mt-2 flex gap-2">
          <a href={src} download={filename} className="text-xs underline" title="Descargar">
            Descargar
          </a>
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs underline" title="Abrir en pestaña">
            Abrir en pestaña
          </a>
        </div>
      </div>
    );
  }

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

type Props = { initialUser?: Record<string, unknown> | null };

/**
 * ClientDocuments mantiene estado local de los URLs de archivos.
 * Escucha el evento global "client-doc-updated" para refrescar
 * inmediatamente la lista y la previsualización sin recargar.
 *
 * Dispara ese evento desde tu form:
 * window.dispatchEvent(new CustomEvent("client-doc-updated", { detail: { key: "passport", url: "<nuevo-url>" }}))
 */
export default function ClientDocuments({ initialUser }: Props) {
  const initialEntries = useMemo(() => {
    const arr: { key: string; label: string; url: string }[] = [];
    if (initialUser) {
      for (const key of ALLOWED_DOC_FIELDS) {
        const v = (initialUser as any)[key];
        if (typeof v === "string" && v.trim()) {
          arr.push({ key, label: FILE_LABELS[key], url: v.trim() });
        }
      }
    }
    return arr;
  }, [initialUser]);

  const [entries, setEntries] = useState(initialEntries);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ key: string; url: string }>).detail;
      if (!detail?.key || !detail?.url) return;

      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.key === detail.key);
        const next = [...prev];
        const label = FILE_LABELS[detail.key] ?? detail.key;
        if (idx >= 0) next[idx] = { key: detail.key, label, url: detail.url };
        else next.push({ key: detail.key, label, url: detail.url });
        return next;
      });
    };

    window.addEventListener("client-doc-updated", handler as EventListener);
    return () => window.removeEventListener("client-doc-updated", handler as EventListener);
  }, []);

  if (!entries.length) return <div className="text-xs text-gray-400">No hay documentos</div>;

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
