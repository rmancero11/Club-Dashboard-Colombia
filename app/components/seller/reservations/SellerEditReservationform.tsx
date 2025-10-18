"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SellerEditReservationForm({
  reservation,
  destinations,
}: {
  reservation: {
    id: string;
    destinationId: string;
    startDate: string;
    endDate: string;
    paxAdults: number;
    paxChildren: number;
    currency: string;
    totalAmount: number;
    notes: string;
  };
  destinations: { id: string; name: string; country?: string | null }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const payload = {
      destinationId: String(formData.get("destinationId")),
      startDate: String(formData.get("startDate")),
      endDate: String(formData.get("endDate")),
      paxAdults: Number(formData.get("paxAdults") || 1),
      paxChildren: Number(formData.get("paxChildren") || 0),
      currency: String(formData.get("currency") || "USD"),
      totalAmount: Number(formData.get("totalAmount") || 0),
      notes: String(formData.get("notes") || ""),
    };

    const res = await fetch(`/api/seller/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo guardar.");
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm">Destino</label>
        <select
          name="destinationId"
          defaultValue={reservation.destinationId}
          className="rounded-md border px-3 py-2 text-sm"
          required
        >
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.country ? ` · ${d.country}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Inicio</label>
          <input
            type="date"
            name="startDate"
            defaultValue={reservation.startDate}
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Fin</label>
          <input
            type="date"
            name="endDate"
            defaultValue={reservation.endDate}
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Adultos</label>
          <input
            type="number"
            min={1}
            name="paxAdults"
            defaultValue={reservation.paxAdults}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Niños</label>
          <input
            type="number"
            min={0}
            name="paxChildren"
            defaultValue={reservation.paxChildren}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Moneda</label>
          <input
            name="currency"
            defaultValue={reservation.currency}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-1 col-span-2">
          <label className="text-sm">Total</label>
          <input
            type="number"
            step="0.01"
            name="totalAmount"
            defaultValue={reservation.totalAmount}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Notas (JSON timeline o texto)</label>
        <textarea
          name="notes"
          defaultValue={reservation.notes}
          rows={4}
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white text-sm"
        >
          {loading ? "Guardando…" : "Guardar cambios"}
        </button>
        <a href="/dashboard-seller/reservas" className="rounded-md border px-4 py-2 text-sm">
          Cancelar
        </a>
      </div>
    </form>
  );
}
