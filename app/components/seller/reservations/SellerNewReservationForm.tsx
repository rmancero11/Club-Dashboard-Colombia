"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; name: string; country?: string };

export default function SellerNewReservationForm({
  clients,
  destinations,
  defaultClientId,
}: {
  clients: Option[];
  destinations: Option[];
  defaultClientId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const payload = {
      clientId: String(formData.get("clientId")),
      destinationId: String(formData.get("destinationId")),
      startDate: String(formData.get("startDate")),
      endDate: String(formData.get("endDate")),
      paxAdults: Number(formData.get("paxAdults") || 1),
      paxChildren: Number(formData.get("paxChildren") || 0),
      notes: String(formData.get("notes") || ""),
      currency: "USD",
      totalAmount: 0,
    };

    const res = await fetch("/api/seller/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo crear la reserva.");
      return;
    }
    router.push(`/dashboard-seller/clientes/${payload.clientId}`);
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm">Cliente</label>
        <select
          name="clientId"
          defaultValue={defaultClientId || ""}
          className="rounded-md border px-3 py-2 text-sm"
          required
        >
          <option value="" disabled>Selecciona un cliente…</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Destino</label>
        <select name="destinationId" className="rounded-md border px-3 py-2 text-sm" required>
          <option value="" disabled>Selecciona un destino…</option>
          {destinations.map(d => (
            <option key={d.id} value={d.id}>
              {d.name}{d.country ? ` · ${d.country}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Inicio</label>
          <input type="date" name="startDate" className="rounded-md border px-3 py-2 text-sm" required />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Fin</label>
          <input type="date" name="endDate" className="rounded-md border px-3 py-2 text-sm" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Adultos</label>
          <input type="number" min={1} name="paxAdults" defaultValue={1} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Niños</label>
          <input type="number" min={0} name="paxChildren" defaultValue={0} className="rounded-md border px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Notas</label>
        <textarea name="notes" rows={3} className="rounded-md border px-3 py-2 text-sm" />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white text-sm"
      >
        {loading ? "Creando…" : "Crear reserva"}
      </button>
    </form>
  );
}
