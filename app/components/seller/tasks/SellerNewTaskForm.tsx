"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ClientOpt = { id: string; name: string };
type ResOpt = { id: string; code: string; destination?: { name?: string | null } | null };

export default function SellerNewTaskForm({
  defaultClientId,
  defaultReservationId,
  clients,
  initialReservations,
}: {
  defaultClientId: string | null;
  defaultReservationId: string | null;
  clients: ClientOpt[];
  initialReservations: ResOpt[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>(defaultClientId || "");
  const [reservations, setReservations] = useState<ResOpt[]>(initialReservations || []);
  const [reservationId, setReservationId] = useState<string>(defaultReservationId || "");

  useEffect(() => {
    // si hay cliente preseleccionado pero no trajimos reservas (por navegación directa), cargarlas
    if (clientId && initialReservations.length === 0) {
      fetch(`/api/seller/clients/${clientId}/reservations`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(json => setReservations(json.items || []))
        .catch(() => setReservations([]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setClientId(value);
    setReservationId(""); // reset
    if (!value) {
      setReservations([]);
      return;
    }
    try {
      const res = await fetch(`/api/seller/clients/${value}/reservations`);
      const json = await res.json();
      setReservations(json.items || []);
    } catch {
      setReservations([]);
    }
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      dueDate: String(formData.get("dueDate") || ""), // yyyy-mm-dd
      priority: String(formData.get("priority") || "MEDIUM"),
      // asociaciones:
      clientId: clientId || null,
      reservationId: reservationId || null,
    };

    const res = await fetch("/api/seller/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo crear la tarea.");
      return;
    }

    const json = await res.json();
    const rid = json?.task?.reservationId;
    const cid = payload.clientId;

    if (rid) return router.push(`/dashboard-seller/reservas/${rid}`);
    if (cid) return router.push(`/dashboard-seller/clientes/${cid}`);
    return router.push(`/dashboard-seller/tareas`);
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      {/* Asociaciones */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Cliente (opcional)</label>
          <select
            name="client"
            value={clientId}
            onChange={onClientChange}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">— Sin cliente —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Reserva (opcional)</label>
          <select
            name="reservation"
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            disabled={!clientId || reservations.length === 0}
          >
            <option value="">— Sin reserva —</option>
            {reservations.map(r => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.destination?.name || "—"}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500">
            Para asociar una reserva, primero elige un cliente.
          </p>
        </div>
      </div>

      {/* Datos de la tarea */}
      <div className="grid gap-1">
        <label className="text-sm">Título</label>
        <input name="title" className="rounded-md border px-3 py-2 text-sm" required />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Descripción</label>
        <textarea name="description" rows={3} className="rounded-md border px-3 py-2 text-sm" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Vencimiento</label>
          <input type="date" name="dueDate" className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Prioridad</label>
          <select name="priority" defaultValue="MEDIUM" className="rounded-md border px-3 py-2 text-sm">
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-md bg-black px-4 py-2 text-white text-sm">
          {loading ? "Creando…" : "Crear tarea"}
        </button>
        <button type="button" onClick={() => history.back()} className="rounded-md border px-4 py-2 text-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}
