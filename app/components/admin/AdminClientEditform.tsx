"use client";

import { useState } from "react";


type Seller = { id: string; name: string | null; email: string };
type SubscriptionPlan = "STANDARD" | "PREMIUM" | "VIP";

export default function AdminClientEditForm({
  clientId,
  currentSellerId,
  currentArchived,
  currentNotes,
  currentSubscriptionPlan,
  currentTravelPoints,
  sellers,
  
}: {
  clientId: string;
  currentSellerId: string;
  currentArchived: boolean;
  currentNotes: string;
  currentSubscriptionPlan: SubscriptionPlan;
  currentTravelPoints: number;
  sellers: Seller[];
 
}) {
  const [sellerId, setSellerId] = useState(currentSellerId);
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>(currentSubscriptionPlan);
  const [archived, setArchived] = useState(currentArchived);
  const [notes, setNotes] = useState(currentNotes);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [addTravelPoints, setAddTravelPoints] = useState(0);
  const [removeTravelPoints, setRemoveTravelPoints] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    try {
      const formData = new FormData();
      formData.append("sellerId", sellerId || "");
      formData.append("isArchived", String(archived));
      formData.append("notes", notes ?? "");
      formData.append("subscriptionPlan", subscriptionPlan);
      formData.append("addTravelPoints", String(addTravelPoints));
      formData.append("removeTravelPoints", String(removeTravelPoints));

      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || `No se pudo actualizar (HTTP ${res.status})`);
      } else {
        setMsg("Cliente actualizado correctamente.");
      }
    } catch (e) {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 max-w-md"
      encType="multipart/form-data"
    >
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

      {/* Vendedor */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Vendedor asignado</span>
        <select
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
          className="rounded-md border px-3 py-2"
          required
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>
      </label>

      {/* Plan de suscripción */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Plan de suscripción</span>
        <select
          value={subscriptionPlan}
          onChange={(e) =>
            setSubscriptionPlan(e.target.value as SubscriptionPlan)
          }
          className="rounded-md border px-3 py-2"
        >
          {["STANDARD", "PREMIUM", "VIP"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      {/* SUMAR PUNTOS */}
<div className="flex flex-col gap-1">
  <label className="text-sm font-medium">Sumar TravelPoints al cliente</label>
  <input
    type="number"
    min={0}
    value={addTravelPoints}
    onChange={(e) => setAddTravelPoints(Number(e.target.value))}
    className="rounded-md border px-2 py-1"
  />
  <p className="text-xs text-gray-500">
    Estos puntos se sumarán a los {currentTravelPoints} actuales.
  </p>
</div>

{/* RESTAR PUNTOS */}
<div className="flex flex-col gap-1">
  <label className="text-sm font-medium">Restar TravelPoints al cliente</label>
  <input
    type="number"
    min={0}
    value={removeTravelPoints}
    onChange={(e) => setRemoveTravelPoints(Number(e.target.value))}
    className="rounded-md border px-2 py-1"
  />
  <p className="text-xs text-gray-500">
    Estos puntos se restaran a los {currentTravelPoints} actuales.
  </p>
</div>



      {/* Archivar */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={archived}
          onChange={(e) => setArchived(e.target.checked)}
        />
        <span>Archivar cliente</span>
      </label>



      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <a
          href="/dashboard-admin/clientes"
          className="rounded-md border px-4 py-2 text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
