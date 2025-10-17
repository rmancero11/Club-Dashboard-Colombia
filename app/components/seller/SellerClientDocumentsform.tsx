"use client";

import { useState, useTransition } from "react";
import { updateClientDocumentsAction } from "@/app/dashboard-seller/clientes/[id]/actions";

type Props = {
  clientId: string;
  current?: {
    purchaseOrder?: string | null;
    flightTickets?: string | null;
    serviceVoucher?: string | null;
    medicalAssistanceCard?: string | null;
    travelTips?: string | null;
  };
  // Opcional: si tienes un endpoint de subida (p. ej. /api/upload) pásalo aquí
  uploadEndpoint?: string;
};

const LABELS: Record<string, string> = {
  purchaseOrder: "Orden de compra",
  flightTickets: "Boletos de vuelo",
  serviceVoucher: "Voucher de servicio",
  medicalAssistanceCard: "Asistencia médica",
  travelTips: "Tips de viaje",
};

export default function SellerClientDocumentsForm({
  clientId,
  current,
  uploadEndpoint,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Estado local para inputs
  const [values, setValues] = useState({
    purchaseOrder: current?.purchaseOrder || "",
    flightTickets: current?.flightTickets || "",
    serviceVoucher: current?.serviceVoucher || "",
    medicalAssistanceCard: current?.medicalAssistanceCard || "",
    travelTips: current?.travelTips || "",
  });

  // (Opcional) Subir archivo a tu endpoint y setear la URL devuelta
  async function handleUpload(key: keyof typeof values, file: File | null) {
    if (!file) return;
    const endpoint = uploadEndpoint || "/api/upload/cloudinary";
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", clientId);
      fd.append("field", key);

      const res = await fetch(endpoint, { method: "POST", body: fd });
      const ct = res.headers.get("content-type") || "";

      let data: any;
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text(); // probablemente HTML (error dev)
        throw new Error(text.slice(0, 200)); // muestra un snippet útil
      }

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Error al subir");
      }

      setValues((v) => ({ ...v, [key]: data.url as string }));
      setMsg("Archivo subido correctamente.");
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "No se pudo subir el archivo");
      setMsg(null);
    }
  }

  function onChange(k: keyof typeof values, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    // Empaquetar las URLs actuales por si el usuario no tocó algún input
    Object.entries(values).forEach(([k, v]) => fd.set(k, v || ""));
    startTransition(async () => {
      const res = await updateClientDocumentsAction(fd);
      if ((res as any)?.ok) {
        setMsg("Documentos actualizados.");
      } else {
        setErr("No se pudieron actualizar los documentos.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            "purchaseOrder",
            "flightTickets",
            "serviceVoucher",
            "medicalAssistanceCard",
            "travelTips",
          ] as const
        ).map((k) => (
          <div key={k} className="space-y-1">
            <label className="block text-sm font-medium">{LABELS[k]}</label>
            {/* Campo URL directa */}
            <input
              name={k}
              value={values[k] || ""}
              onChange={(e) => onChange(k, e.target.value)}
              placeholder="Pega aquí una URL (Drive/Cloudinary)"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            {/* Opcional: Subir archivo si hay endpoint */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => handleUpload(k, e.target.files?.[0] || null)}
                className="text-xs"
              />
              {values[k] && (
                <a
                  href={values[k]!}
                  target="_blank"
                  className="text-xs text-blue-600 underline"
                >
                  Ver actual
                </a>
              )}
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
