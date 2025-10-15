"use client";

import { useState } from "react";

// 👉 Alineado al enum ReservationStatus del schema.prisma
type Status =
  | "LEAD"
  | "QUOTED"
  | "HOLD"
  | "CONFIRMED"
  | "TRAVELING"
  | "COMPLETED"
  | "CANCELED"
  | "EXPIRED";

// Etiquetas en español (solo UI)
const LABELS_ES: Record<Status, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  HOLD: "En espera",
  CONFIRMED: "Confirmada",
  TRAVELING: "En viaje",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Vencida",
};

// (Opcional) Colores tipo “píldora” por estado (solo UI)
const PILL_CLASS: Record<Status, string> = {
  LEAD: "border-gray-200 bg-gray-50 text-gray-700",
  QUOTED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  HOLD: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-sky-200 bg-sky-50 text-sky-700",
  TRAVELING: "border-cyan-200 bg-cyan-50 text-cyan-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELED: "border-rose-200 bg-rose-50 text-rose-700",
  EXPIRED: "border-stone-200 bg-stone-50 text-stone-700",
};

const BASE_BTN =
  "rounded-md border px-3 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20";
const SELECTED_BTN = "bg-black text-white border-black hover:bg-black";

export default function UpdateReservationStatus({
  id,
  status,
}: { id: string; status: Status }) {
  const [value, setValue] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  async function update(newStatus: Status) {
    if (loading || newStatus === value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // 👇 Se envía el valor EXACTO del enum (lógica en inglés)
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo cambiar el estado");
        return;
      }
      setValue(newStatus);
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  // Orden recomendado (embudo):
  const buttons: Status[] = [
    "LEAD",
    "QUOTED",
    "HOLD",
    "CONFIRMED",
    "TRAVELING",
    "COMPLETED",
    "CANCELED",
    "EXPIRED",
  ];

  return (
    <div className="flex flex-wrap gap-2" aria-label="Actualizar estado de la reserva">
      {buttons.map((s) => (
        <button
          key={s}
          onClick={() => update(s)}
          disabled={loading}
          className={`${BASE_BTN} ${value === s ? SELECTED_BTN : ""} disabled:opacity-60 disabled:pointer-events-none`}
          aria-pressed={value === s}
          title={`Cambiar a: ${LABELS_ES[s]}`}
        >
          {LABELS_ES[s]}
        </button>
      ))}
    </div>
  );
}
