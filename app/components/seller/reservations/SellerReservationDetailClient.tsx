"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Helpers reutilizados
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

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

const RES_PILL: Record<string, string> = {
  LEAD: "bg-gray-50 border-gray-200 text-gray-700",
  QUOTED: "bg-indigo-50 border-indigo-200 text-indigo-700",
  HOLD: "bg-amber-50 border-amber-200 text-amber-700",
  CONFIRMED: "bg-sky-50 border-sky-200 text-sky-700",
  TRAVELING: "bg-cyan-50 border-cyan-200 text-cyan-700",
  COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
  CANCELED: "bg-rose-50 border-rose-200 text-rose-700",
  EXPIRED: "bg-stone-50 border-stone-200 text-stone-700",
};

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO");
}

export default function SellerReservationDetailClient({
  reservation,
  destinations,
}: {
  reservation: any;
  destinations: any[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(reservation.status);
  const [loading, setLoading] = useState(false);

  const pill = RES_PILL[status] || "bg-gray-50 border-gray-200 text-gray-700";
  const statusLabel = RES_LABELS[status] ?? status;

  async function updateStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setLoading(true);
    const res = await fetch(`/api/seller/reservations/${reservation.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    } else {
      alert("No se pudo cambiar el estado");
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{reservation.code}</h1>
          <div className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${pill}`}>
            {statusLabel}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {reservation.client?.name || "—"} · {reservation.destination?.name || "—"} (
            {reservation.destination?.country || "—"})
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </button>
      </header>

      {/* Estado */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Estado</h2>
        <select
          onChange={updateStatus}
          value={status}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {Object.keys(RES_LABELS).map((key) => (
            <option key={key} value={key}>
              {RES_LABELS[key]}
            </option>
          ))}
        </select>
      </section>

      {/* Datos generales */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Detalles</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="text-gray-500">Destino: </span>
            {reservation.destination?.name || "—"}
          </li>
          <li>
            <span className="text-gray-500">Fechas: </span>
            {fmtDate(reservation.startDate)} → {fmtDate(reservation.endDate)}
          </li>
          <li>
            <span className="text-gray-500">Pasajeros: </span>
            {reservation.paxAdults} adultos / {reservation.paxChildren} niños
          </li>
          <li>
            <span className="text-gray-500">Total: </span>
            {money(Number(reservation.totalAmount), reservation.currency)}
          </li>
        </ul>
      </section>
    </div>
  );
}
