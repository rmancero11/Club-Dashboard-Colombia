"use client";

import { useEffect, useMemo, useState } from "react";

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
  startDate?: string; // ISO (opcional)
  endDate?: string;   // ISO (opcional)
}) {
  const [value, setValue] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  // Si no llegan por props, intentamos leer las metas del DOM
  const [metaStartISO, setMetaStartISO] = useState<string | undefined>(undefined);
  const [metaEndISO, setMetaEndISO] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!startDate) {
      const el = document.getElementById("res-start");
      const iso = el?.getAttribute("content") || undefined;
      setMetaStartISO(iso);
    }
    if (!endDate) {
      const el = document.getElementById("res-end");
      const iso = el?.getAttribute("content") || undefined;
      setMetaEndISO(iso);
    }
  }, [startDate, endDate]);

  // Prioridad: props -> metas -> undefined
  const start = useMemo(
    () => (startDate ? new Date(startDate) : metaStartISO ? new Date(metaStartISO) : undefined),
    [startDate, metaStartISO]
  );
  const end = useMemo(
    () => (endDate ? new Date(endDate) : metaEndISO ? new Date(metaEndISO) : undefined),
    [endDate, metaEndISO]
  );

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

    // Validamos con "now" fresco en cada click
    const check = canTransition(value, newStatus, new Date(), start, end);
    if (!check.ok) {
      alert(`No permitido: ${check.reason}`);
      return;
    }

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
        const check = canTransition(value, s, new Date(), start, end); // para tooltips/disabled en render
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
