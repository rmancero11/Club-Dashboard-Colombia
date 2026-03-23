"use client";

import { useState } from "react";

type Seller = { id: string; name: string | null; email: string };
type SubscriptionPlan = "STANDARD" | "PREMIUM" | "VIP";
type Destination = { id: string; name: string };

export default function AdminClientEditForm({
  clientId,
  currentSellerId,
  currentArchived,
  currentNotes,
  currentSubscriptionPlan,
  currentTravelPoints,
  sellers,
  destinations,
}: {
  clientId: string;
  currentSellerId: string;
  currentArchived: boolean;
  currentNotes: string;
  currentSubscriptionPlan: SubscriptionPlan;
  currentTravelPoints: number;
  sellers: Seller[];
  destinations: Destination[];
}) {
  const [sellerId, setSellerId] = useState(currentSellerId);
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>(currentSubscriptionPlan);
  const [archived, setArchived] = useState(currentArchived);
  const [notes, setNotes] = useState(currentNotes);
  const [subValidFrom, setSubValidFrom] = useState<string>("");
const [subExpiresAt, setSubExpiresAt] = useState<string>("");

  const [addTravelPoints, setAddTravelPoints] = useState(0);
const [resetTravelPoints, setResetTravelPoints] = useState(false);

const [validFrom, setValidFrom] = useState<string>("");
const [expiresAt, setExpiresAt] = useState<string>("");

const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);


  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    // ================= Validaciones =================
    if (addTravelPoints > 0) {
  if (!expiresAt) {
    setErr("Debés indicar hasta qué fecha son válidos los Travel Points.");
    setLoading(false);
    return;
  }

  if (
    validFrom &&
    new Date(validFrom).getTime() > new Date(expiresAt).getTime()
  ) {
    setErr("La fecha desde no puede ser posterior a la fecha hasta.");
    setLoading(false);
    return;
  }
  if (subValidFrom && subExpiresAt) {
  if (new Date(subValidFrom) >= new Date(subExpiresAt)) {
    setErr("La fecha de inicio de suscripción debe ser menor a la de expiración.");
    setLoading(false);
    return;
  }
}

  if (selectedDestinations.length === 0) {
    setErr("Debés seleccionar al menos un destino.");
    setLoading(false);
    return;
  }
}


    try {
      const formData = new FormData();

      formData.append("sellerId", sellerId);
      formData.append("isArchived", String(archived));
      formData.append("notes", notes ?? "");
      formData.append("subscriptionPlan", subscriptionPlan);
      if (subValidFrom) {
  formData.append("subscriptionValidFrom", subValidFrom);
}

if (subExpiresAt) {
  formData.append("subscriptionExpiresAt", subExpiresAt);
}

      formData.append("addTravelPoints", String(addTravelPoints));
formData.append("resetTravelPoints", String(resetTravelPoints));

if (addTravelPoints > 0) {
  if (validFrom) {
    formData.append("travelPointsValidFrom", validFrom);
  }

  formData.append("travelPointsExpiresAt", expiresAt);

  formData.append(
    "travelPointsDestinations",
    JSON.stringify(selectedDestinations)
  );
}
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || `No se pudo actualizar (HTTP ${res.status})`);
      } else {
        setMsg("Cliente actualizado correctamente.");
        setAddTravelPoints(0);
        setSelectedDestinations([]);
        setResetTravelPoints(false);
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  function toggleDestination(id: string) {
    setSelectedDestinations((prev) =>
      prev.includes(id)
        ? prev.filter((d) => d !== id)
        : [...prev, id]
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 max-w-md"
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
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>
      </label>

      {/* Plan */}
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

      <div className="grid gap-2">
  <label className="text-sm font-medium">
    Suscripción válida desde
  </label>
  <input
    type="date"
    value={subValidFrom}
    onChange={(e) => setSubValidFrom(e.target.value)}
    className="rounded-md border px-2 py-1"
  />

  <label className="text-sm font-medium">
    Suscripción válida hasta
  </label>
  <input
    type="date"
    value={subExpiresAt}
    onChange={(e) => setSubExpiresAt(e.target.value)}
    className="rounded-md border px-2 py-1"
  />
</div>

      {/* Travel Points */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">
          Sumar Travel Points ({currentTravelPoints} actuales)
        </label>
        <input
          type="number"
          min={0}
          value={addTravelPoints}
          onChange={(e) => setAddTravelPoints(Number(e.target.value))}
          className="rounded-md border px-2 py-1"
        />

        {addTravelPoints > 0 && (
  <div className="grid gap-2">
    <label className="text-sm font-medium">
      Válidos desde (opcional)
    </label>
    <input
      type="date"
      value={validFrom}
      onChange={(e) => setValidFrom(e.target.value)}
      className="rounded-md border px-2 py-1"
    />

    <label className="text-sm font-medium">
      Válidos hasta
    </label>
    <input
      type="date"
      required
      value={expiresAt}
      onChange={(e) => setExpiresAt(e.target.value)}
      className="rounded-md border px-2 py-1"
    />
  </div>
)}

      </div>

      {/* Destinos */}
      {addTravelPoints > 0 && destinations?.length > 0 && (
  <div className="grid gap-1">
    <span className="text-sm font-medium">
      Destinos válidos
    </span>

    {destinations.map((d) => (
      <label key={d.id} className="flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={selectedDestinations.includes(d.id)}
          onChange={() => toggleDestination(d.id)}
        />
        {d.name}
      </label>
    ))}
  </div>
)}


      {/* Reset */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={resetTravelPoints}
          onChange={(e) => setResetTravelPoints(e.target.checked)}
        />
        Eliminar todos los Travel Points
      </label>

      {resetTravelPoints && (
        <p className="text-xs text-red-600">
          Se eliminarán {currentTravelPoints} puntos actuales.
        </p>
      )}

      {/* Archivar */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={archived}
          onChange={(e) => setArchived(e.target.checked)}
        />
        Archivar cliente
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
