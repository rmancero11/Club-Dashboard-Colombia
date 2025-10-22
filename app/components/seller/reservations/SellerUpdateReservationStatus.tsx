"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReservationStatus as PrismaReservationStatus } from "@prisma/client";

// Fuente única de verdad: enum de Prisma
type ReservationStatus = PrismaReservationStatus;

// Lista fija para iterar (evita Object.keys + cast)
const ALL_STATUSES: ReservationStatus[] = [
  "LEAD",
  "QUOTED",
  "HOLD",
  "CONFIRMED",
  "TRAVELING",
  "COMPLETED",
  "CANCELED",
  "EXPIRED",
];

const RES_LABELS: Record<ReservationStatus, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  HOLD: "En espera",
  CONFIRMED: "Confirmada",
  TRAVELING: "En viaje",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Vencida",
};

export default function SellerUpdateReservationStatus({
  id,
  status,
  allowedNext = [],
}: {
  id: string;
  status: ReservationStatus;
  /** Estados a los que SÍ se puede cambiar desde el actual */
  allowedNext?: ReservationStatus[];
}) {
  const router = useRouter();
  const [value, setValue] = useState<ReservationStatus>(status);
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ReservationStatus;
    if (next === status) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "No se pudo actualizar el estado.");
        setValue(status);
        return;
      }
      setValue(next);
      router.refresh();
    } catch {
      alert("Error de red.");
      setValue(status);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm text-gray-600">Cambiar estado:</label>
      <select
        className="rounded-md border px-2 py-1 text-sm"
        onChange={onChange}
        value={value}
        disabled={loading}
      >
        {ALL_STATUSES.map((s) => {
          const disabled =
            s !== status && allowedNext.length > 0 && !allowedNext.includes(s);
          return (
            <option key={s} value={s} disabled={disabled}>
              {RES_LABELS[s]}{disabled ? " (bloqueado)" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
