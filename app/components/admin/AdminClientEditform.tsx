"use client";

import { useState } from "react";

type Seller = { id: string; name: string | null; email: string };

export default function AdminClientEditForm({
  clientId,
  currentSellerId,
  currentArchived,
  currentNotes,
  sellers,
}: {
  clientId: string;
  currentSellerId: string;
  currentArchived: boolean;
  currentNotes: string;
  sellers: Seller[];
}) {
  const [sellerId, setSellerId] = useState(currentSellerId);
  const [archived, setArchived] = useState(currentArchived);
  const [notes, setNotes] = useState(currentNotes);

  // Archivos
  const [purchaseOrder, setPurchaseOrder] = useState<File | null>(null);
  const [flightTickets, setFlightTickets] = useState<File | null>(null);
  const [serviceVoucher, setServiceVoucher] = useState<File | null>(null);
  const [medicalAssistanceCard, setMedicalAssistanceCard] = useState<File | null>(null);
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
      formData.append("sellerId", sellerId || "");
      formData.append("isArchived", String(archived));
      formData.append("notes", notes);

      if (purchaseOrder) formData.append("purchaseOrder", purchaseOrder);
      if (flightTickets) formData.append("flightTickets", flightTickets);
      if (serviceVoucher) formData.append("serviceVoucher", serviceVoucher);
      if (medicalAssistanceCard) formData.append("medicalAssistanceCard", medicalAssistanceCard);
      if (travelTips) formData.append("travelTips", travelTips);

      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "No se pudo actualizar");
      } else {
        setMsg("Cliente actualizado correctamente.");
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md" encType="multipart/form-data">
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

      {/* Vendedor asignado */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Vendedor asignado</span>
        <select
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
          className="rounded-md border px-3 py-2"
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>
      </label>

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

      {/* Archivos */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Orden de compra</span>
        <input type="file" onChange={(e) => setPurchaseOrder(e.target.files?.[0] ?? null)} />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Boletos de vuelo</span>
        <input type="file" onChange={(e) => setFlightTickets(e.target.files?.[0] ?? null)} />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Voucher de servicio</span>
        <input type="file" onChange={(e) => setServiceVoucher(e.target.files?.[0] ?? null)} />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Asistencia médica</span>
        <input
          type="file"
          onChange={(e) => setMedicalAssistanceCard(e.target.files?.[0] ?? null)}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Tips de viaje</span>
        <input type="file" onChange={(e) => setTravelTips(e.target.files?.[0] ?? null)} />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <a href="/dashboard-admin/clientes" className="rounded-md border px-4 py-2 text-sm">
          Cancelar
        </a>
      </div>
    </form>
  );
}
