"use client";

import { useState } from "react";

type Seller = { id: string; name: string | null; email: string };

// Enum/union del plan de suscripción
type SubscriptionPlan = "STANDARD" | "PREMIUM" | "VIP";

// Mapa legible para UI (opcional: si quieres etiquetas distintas)
const SUBSCRIPTION_LABEL: Record<SubscriptionPlan, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  VIP: "VIP",
};

// Campos de documentos permitidos (en User)
const DOC_KEYS = [
  "purchaseOrder",
  "flightTickets",
  "serviceVoucher",
  "medicalAssistanceCard",
  "travelTips",
] as const;

// Función para emitir evento de actualización de documentos
function emitDocUpdated(key: typeof DOC_KEYS[number], url: string) {
  if (!url) return;
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("client-doc-updated", { detail: { key, url } })
  );
}

export default function AdminClientEditForm({
  clientId,
  currentSellerId,
  currentArchived,
  currentNotes,
  currentSubscriptionPlan, // <<< NUEVO PROP
  sellers,
}: {
  clientId: string;
  currentSellerId: string;
  currentArchived: boolean;
  currentNotes: string;
  currentSubscriptionPlan: SubscriptionPlan; // <<< NUEVO PROP
  sellers: Seller[];
}) {
  const [sellerId, setSellerId] = useState(currentSellerId);
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>(currentSubscriptionPlan); // <<< NUEVO ESTADO
  const [archived, setArchived] = useState(currentArchived);
  const [notes, setNotes] = useState(currentNotes);

  // Archivos (se guardan en el User asociado al Client)
  const [purchaseOrder, setPurchaseOrder] = useState<File | null>(null);
  const [flightTickets, setFlightTickets] = useState<File | null>(null);
  const [serviceVoucher, setServiceVoucher] = useState<File | null>(null);
  const [medicalAssistanceCard, setMedicalAssistanceCard] =
    useState<File | null>(null);
  const [travelTips, setTravelTips] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    try {
      const formData = new FormData();
      formData.append("sellerId", sellerId || ""); // requerido por el schema
      formData.append("isArchived", String(archived));
      formData.append("notes", notes ?? "");
      formData.append("subscriptionPlan", subscriptionPlan); // <<< ENVÍO DEL PLAN

      if (purchaseOrder) formData.append("purchaseOrder", purchaseOrder);
      if (flightTickets) formData.append("flightTickets", flightTickets);
      if (serviceVoucher) formData.append("serviceVoucher", serviceVoucher);
      if (medicalAssistanceCard)
        formData.append("medicalAssistanceCard", medicalAssistanceCard);
      if (travelTips) formData.append("travelTips", travelTips);

      // La API debe actualizar:
      // - Client: sellerId, isArchived, notes, subscriptionPlan
      // - User: documentos
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        setErr(data?.error || `No se pudo actualizar (HTTP ${res.status})`);
      } else {
        setMsg("Cliente actualizado correctamente.");

        // Emite evento con URLs definitivas si tu API las devuelve
        const updated = data?.updated ?? data?.user ?? data ?? {};
        (DOC_KEYS as readonly string[]).forEach((k) => {
          const url = updated[k as keyof typeof updated];
          if (typeof url === "string" && url.trim()) {
            emitDocUpdated(k as any, url.trim());
          }
        });
      }
    } catch (e) {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 max-w-md"
      encType="multipart/form-data"
    >
      {err && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {msg}
        </div>
      )}

      {/* Vendedor asignado (obligatorio) */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Vendedor asignado</span>
        <select
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
          className="rounded-md border px-3 py-2"
          required
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>
      </label>

      {/* <<< NUEVO: Plan de Suscripción >>> */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Plan de suscripción</span>
        <select
          value={subscriptionPlan}
          onChange={(e) => setSubscriptionPlan(e.target.value as SubscriptionPlan)}
          className="rounded-md border px-3 py-2"
        >
          {(Object.keys(SUBSCRIPTION_LABEL) as SubscriptionPlan[]).map((p) => (
            <option key={p} value={p}>
              {SUBSCRIPTION_LABEL[p]}
            </option>
          ))}
        </select>
      </label>
      {/* ^^^ FIN SUSCRIPCIÓN ^^^ */}

      {/* Archivar */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={archived}
          onChange={(e) => setArchived(e.target.checked)}
        />
        <span>Archivar cliente</span>
      </label>

      {/* Notas */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Notas</span>
        <textarea
          rows={4}
          className="rounded-md border px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {/* Archivos (PDF/imagen/video). La API debe almacenar en User.* */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Orden de compra</span>
        <input
          type="file"
          accept="application/pdf,image/*,video/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setPurchaseOrder(f);
            if (f) emitDocUpdated("purchaseOrder", URL.createObjectURL(f));
          }}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Boletos de vuelo</span>
        <input
          type="file"
          accept="application/pdf,image/*,video/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFlightTickets(f);
            if (f) emitDocUpdated("flightTickets", URL.createObjectURL(f));
          }}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Voucher de servicio</span>
        <input
          type="file"
          accept="application/pdf,image/*,video/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setServiceVoucher(f);
            if (f) emitDocUpdated("serviceVoucher", URL.createObjectURL(f));
          }}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Asistencia médica</span>
        <input
          type="file"
          accept="application/pdf,image/*,video/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setMedicalAssistanceCard(f);
            if (f)
              emitDocUpdated("medicalAssistanceCard", URL.createObjectURL(f));
          }}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Tips de viaje</span>
        <input
          type="file"
          accept="application/pdf,image/*,video/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setTravelTips(f);
            if (f) emitDocUpdated("travelTips", URL.createObjectURL(f));
          }}
        />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <a
          href="/dashboard-admin/clientes"
          className="rounded-md border px-4 py-2 text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
