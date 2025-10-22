"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateClientDocumentsAction } from "@/app/dashboard-seller/clientes/[id]/actions";

type DocKey =
  | "purchaseOrder"
  | "flightTickets"
  | "serviceVoucher"
  | "medicalAssistanceCard"
  | "travelTips";

const KEYS = [
  "purchaseOrder",
  "flightTickets",
  "serviceVoucher",
  "medicalAssistanceCard",
  "travelTips",
] as const satisfies DocKey[];

const LABELS = {
  purchaseOrder: "Orden de compra",
  flightTickets: "Boletos de vuelo",
  serviceVoucher: "Voucher de servicio",
  medicalAssistanceCard: "Asistencia médica",
  travelTips: "Tips de viaje",
} as const satisfies Record<DocKey, string>;

type Props = {
  clientId: string;
  current?: Partial<Record<DocKey, string | null>>;
  /** Endpoint opcional para subir archivos (por defecto: /api/upload/cloudinary) */
  uploadEndpoint?: string;
};

// Validaciones de archivo (ajusta si quieres permitir videos, etc.)
const MAX_MB = 20;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ACCEPT_MIME = [
  // PDFs
  "application/pdf",
  // Imágenes
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export default function SellerClientDocumentsForm({
  clientId,
  current,
  uploadEndpoint,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [values, setValues] = useState<Record<DocKey, string>>({
    purchaseOrder: current?.purchaseOrder ?? "",
    flightTickets: current?.flightTickets ?? "",
    serviceVoucher: current?.serviceVoucher ?? "",
    medicalAssistanceCard: current?.medicalAssistanceCard ?? "",
    travelTips: current?.travelTips ?? "",
  });

  // Limpia mensajes al cambiar valores
  useEffect(() => {
    if (msg) setMsg(null);
    if (err) setErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const acceptAttr = useMemo(() => ACCEPT_MIME.join(","), []);

  function onChange(k: DocKey, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  // Subida de archivo al endpoint (opcional)
  async function handleUpload(k: DocKey, file: File | null) {
    if (!file) return;

    if (!ACCEPT_MIME.includes(file.type)) {
      setErr("Tipo de archivo no permitido. Usa PDF o imagen (JPG/PNG/WEBP/GIF/AVIF).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr(`Archivo demasiado grande. Máximo ${MAX_MB} MB.`);
      return;
    }

    const endpoint = uploadEndpoint || "/api/upload/cloudinary";
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", clientId);
      fd.append("field", k);

      const res = await fetch(endpoint, { method: "POST", body: fd });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(text.slice(0, 300) || "Error del servidor de subida.");
      }
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "No se pudo subir el archivo.");
      }

      setValues((v) => ({ ...v, [k]: data.url! }));
      setMsg("Archivo subido correctamente.");
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "No se pudo subir el archivo.");
      setMsg(null);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const fd = new FormData();
    fd.set("clientId", clientId);
    // Solo keys permitidas
    for (const k of KEYS) {
      fd.set(k, values[k] || "");
    }

    startTransition(async () => {
      try {
        const res = await updateClientDocumentsAction(fd);
        if (res?.ok) {
          setMsg("Documentos actualizados.");
          setErr(null);
        } else {
          setErr("No se pudieron actualizar los documentos.");
        }
      } catch (e: any) {
        setErr(e?.message || "Ocurrió un error al guardar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-2">
        {KEYS.map((k) => (
          <div key={k} className="space-y-1">
            <label className="block text-sm font-medium">{LABELS[k]}</label>

            {/* Campo URL directa */}
            <input
              name={k}
              value={values[k] || ""}
              onChange={(e) => onChange(k, e.target.value)}
              placeholder="Pega aquí una URL (Drive/Cloudinary)"
              className="w-full rounded-md border px-3 py-2 text-sm"
              aria-label={LABELS[k]}
              autoComplete="off"
              inputMode="url"
            />

            {/* Subir archivo (opcional) */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept={acceptAttr}
                onChange={(e) => handleUpload(k, e.target.files?.[0] || null)}
                className="text-xs"
                aria-label={`Subir ${LABELS[k]}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar documentos"}
        </button>
        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
        {err && <span className="text-xs text-rose-700">{err}</span>}
      </div>
    </form>
  );
}
