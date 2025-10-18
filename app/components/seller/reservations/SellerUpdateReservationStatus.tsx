"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RES_LABELS: Record<string, string> = {
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
}: {
  id: string;
  status:
    | "LEAD"
    | "QUOTED"
    | "HOLD"
    | "CONFIRMED"
    | "TRAVELING"
    | "COMPLETED"
    | "CANCELED"
    | "EXPIRED";
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as typeof status;
    setLoading(true);
    const res = await fetch(`/api/seller/reservations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo actualizar el estado.");
      setValue(status);
      return;
    }
    setValue(next);
    router.refresh();
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
        {Object.keys(RES_LABELS).map((s) => (
          <option key={s} value={s}>
            {RES_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
