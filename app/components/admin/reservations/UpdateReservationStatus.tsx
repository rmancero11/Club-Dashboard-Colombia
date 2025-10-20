"use client";

import { useMemo, useState } from "react";

type Status =
  | "LEAD"
  | "QUOTED"
  | "HOLD"
  | "CONFIRMED"
  | "TRAVELING"
  | "COMPLETED"
  | "CANCELED"
  | "EXPIRED";

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

const ALLOWED: Partial<Record<Status, Status[]>> = {
  LEAD: ["QUOTED", "CANCELED"],
  QUOTED: ["HOLD", "CONFIRMED", "CANCELED", "EXPIRED"],
  HOLD: ["CONFIRMED", "QUOTED", "CANCELED", "EXPIRED"],
  CONFIRMED: ["TRAVELING", "CANCELED"],
  TRAVELING: ["COMPLETED"],
  EXPIRED: ["QUOTED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

const BASE_BTN =
  "rounded-md border px-3 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20";
const SELECTED_BTN = "bg-black text-white border-black hover:bg-black";

function canTransition(from: Status, to: Status, now: Date, start?: Date, end?: Date) {
  if (!(ALLOWED[from] || []).includes(to)) {
    return { ok: false, reason: "Transición no permitida" };
  }
  // Si no tengo fechas, no bloqueo por tiempo
  if (!start || !end) return { ok: true };

  if (to === "TRAVELING" && now < start) {
    return { ok: false, reason: "El viaje no ha iniciado" };
  }
  if (to === "COMPLETED" && now < end) {
    return { ok: false, reason: "El viaje no ha finalizado" };
  }
  if (from === "CONFIRMED" && to === "CANCELED" && now >= start) {
    return { ok: false, reason: "No se puede cancelar luego del inicio" };
  }
  return { ok: true };
}

export default function UpdateReservationStatus({
  id,
  status,
  startDate,
  endDate,
}: {
  id: string;
  status: Status;
  startDate?: string; // ISO
  endDate?: string;   // ISO
}) {
  const [value, setValue] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  const start = useMemo(() => (startDate ? new Date(startDate) : undefined), [startDate]);
  const end = useMemo(() => (endDate ? new Date(endDate) : undefined), [endDate]);
  const now = useMemo(() => new Date(), []); // recalcula al cambiar estado (opcional)

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

  async function update(newStatus: Status) {
    if (loading || newStatus === value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        alert(data?.error || "No se pudo cambiar el estado");
        return;
      }
      setValue(newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="Actualizar estado de la reserva">
      {buttons.map((s) => {
        const check = canTransition(value, s, now, start, end);
        const isSelected = value === s;
        const disabled = loading || (!isSelected && !check.ok);

        return (
          <button
            key={s}
            onClick={() => update(s)}
            disabled={disabled}
            className={`${BASE_BTN} ${isSelected ? SELECTED_BTN : ""} disabled:opacity-60 disabled:pointer-events-none`}
            aria-pressed={isSelected}
            title={
              isSelected
                ? `${LABELS_ES[s]} (actual)`
                : check.ok
                ? `Cambiar a: ${LABELS_ES[s]}`
                : `No permitido: ${check.reason}`
            }
          >
            {LABELS_ES[s]}
          </button>
        );
      })}
    </div>
  );
}
