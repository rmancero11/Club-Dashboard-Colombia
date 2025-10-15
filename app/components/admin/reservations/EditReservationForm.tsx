"use client";

import { useMemo, useState } from "react";
import ReactSelect from "react-select";
import { getCurrencyOptions, type CurrencyOption } from "@/app/lib/currencyOptions";

type Opt = { id: string; name: string | null; email?: string | null; country?: string | null };

export default function EditReservationForm({
  reservation,
  sellers,
  clients,
  destinations,
  currencyOptions, // opcional: permite sobreescribir las opciones por props si lo necesitas
}: {
  reservation: {
    id: string;
    sellerId: string;
    clientId: string;
    destinationId: string;
    startDate: string;
    endDate: string;
    paxAdults: number;
    paxChildren: number;
    currency: string;
    totalAmount: number;
    notes: string;
  };
  sellers: Opt[];
  clients: Opt[];
  destinations: Opt[];
  currencyOptions?: CurrencyOption[];
}) {
  const [sellerId, setSellerId] = useState(reservation.sellerId);
  const [clientId, setClientId] = useState(reservation.clientId);
  const [destinationId, setDestinationId] = useState(reservation.destinationId);
  const [startDate, setStartDate] = useState(reservation.startDate);
  const [endDate, setEndDate] = useState(reservation.endDate);
  const [paxAdults, setPaxAdults] = useState(reservation.paxAdults);
  const [paxChildren, setPaxChildren] = useState(reservation.paxChildren);
  const [currency, setCurrency] = useState(reservation.currency);
  const [totalAmount, setTotalAmount] = useState(String(reservation.totalAmount));
  const [notes, setNotes] = useState(reservation.notes || "");
  const [saving, setSaving] = useState(false);

  // Opciones de moneda: si llegan por props se usan; si no, se generan todas
  const currencyOptionsAll = useMemo<CurrencyOption[]>(
    () => currencyOptions ?? getCurrencyOptions(),
    [currencyOptions]
  );
  const selectedCurrency =
    currencyOptionsAll.find((o) => o.value === currency) || null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sellerId,
          clientId,
          destinationId,
          startDate,
          endDate,
          paxAdults,
          paxChildren,
          currency,
          totalAmount: totalAmount ? Number(totalAmount) : 0,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo actualizar");
        return;
      }
      location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Vendedor</span>
          <select
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="rounded-md border px-3 py-2"
          >
            <option value="">—</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Cliente</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-md border px-3 py-2"
          >
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Destino</span>
        <select
          value={destinationId}
          onChange={(e) => setDestinationId(e.target.value)}
          className="rounded-md border px-3 py-2"
        >
          <option value="">—</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.country}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Inicio</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Fin</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Adultos</span>
          <input
            type="number"
            min={1}
            value={paxAdults}
            onChange={(e) => setPaxAdults(parseInt(e.target.value, 10) || 1)}
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Niños</span>
          <input
            type="number"
            min={0}
            value={paxChildren}
            onChange={(e) => setPaxChildren(parseInt(e.target.value, 10) || 0)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Moneda</span>
          <ReactSelect
            inputId="currency-edit"
            instanceId="currency-edit"
            className="text-sm"
            classNamePrefix="rs"
            placeholder="Selecciona moneda…"
            value={selectedCurrency}
            onChange={(opt) => setCurrency((opt as CurrencyOption)?.value || "USD")}
            options={currencyOptionsAll}
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: 6,
                minHeight: 38,
                borderColor: "#e5e7eb",
                boxShadow: "none",
                ":hover": { borderColor: "#d1d5db" },
              }),
              valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
              indicatorsContainer: (base) => ({ ...base, paddingRight: 6 }),
              menu: (base) => ({ ...base, zIndex: 30 }),
            }}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Total</span>
        <input
          type="number"
          step="0.01"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Notas</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
