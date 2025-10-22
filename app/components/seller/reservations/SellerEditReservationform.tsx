"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ReactSelect from "react-select";
import {
  getCurrencyOptions,
  type CurrencyOption,
} from "@/app/lib/currencyOptions";

export default function SellerEditReservationForm({
  reservation,
  destinations,
  currencyOptions,
  defaultCurrency,
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
  currencyOptions?: CurrencyOption[];
  defaultCurrency?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Opciones de moneda
  const currencyOptionsAll = useMemo<CurrencyOption[]>(
    () => currencyOptions ?? getCurrencyOptions(),
    [currencyOptions]
  );

  // Estado del selector de moneda
  const [currency, setCurrency] = useState<string>(
    defaultCurrency || reservation.currency || "USD"
  );

  const selectedCurrency =
    currencyOptionsAll.find((o) => o.value === currency) || null;

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setErr(null);
    setSuccess(null);
    try {
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
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error || "No se pudo guardar la reserva.");
        return;
      }

      // Éxito: muestra banner y refresca la vista
      setSuccess("Cambios guardados correctamente.");
      // Si prefieres NO refrescar, comenta esta línea
      setTimeout(() => {
        router.refresh();
      }, 900);
    } catch {
      setErr("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      {/* Alerts */}
      {err && (
        <div
          className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          role="alert"
          aria-live="assertive"
        >
          {err}
        </div>
      )}
      {success && (
        <div
          className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      )}

      {/* Destino */}
      <div className="grid gap-1">
        <label className="text-sm">Destino</label>
        <select
          name="destinationId"
          defaultValue={reservation.destinationId}
          className="rounded-md border px-3 py-2 text-sm"
          required
          disabled={loading}
        >
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.country ? ` · ${d.country}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Inicio</label>
          <input
            type="date"
            name="startDate"
            defaultValue={reservation.startDate}
            className="rounded-md border px-3 py-2 text-sm"
            required
            disabled={loading}
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
            disabled={loading}
          />
        </div>
      </div>

      {/* Pasajeros */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Adultos</label>
          <input
            type="number"
            min={1}
            name="paxAdults"
            defaultValue={reservation.paxAdults}
            className="rounded-md border px-3 py-2 text-sm"
            disabled={loading}
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
            disabled={loading}
          />
        </div>
      </div>

      {/* Moneda y total */}
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Moneda</label>
          <ReactSelect
            inputId="currency"
            instanceId="currency"
            className="text-sm"
            classNamePrefix="rs"
            placeholder="Selecciona moneda…"
            value={selectedCurrency}
            onChange={(opt) =>
              setCurrency(((opt as CurrencyOption) || { value: "USD" }).value)
            }
            options={currencyOptionsAll}
            isDisabled={loading}
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
          {/* Hidden field para enviar la moneda en el FormData */}
          <input type="hidden" name="currency" value={currency} />
        </div>

        <div className="grid gap-1 col-span-2">
          <label className="text-sm">Total</label>
          <input
            type="number"
            step="0.01"
            name="totalAmount"
            defaultValue={reservation.totalAmount}
            className="rounded-md border px-3 py-2 text-sm"
            disabled={loading}
          />
        </div>
      </div>

      {/* Notas */}
      <div className="grid gap-1">
        <label className="text-sm">Notas</label>
        <textarea
          name="notes"
          defaultValue={reservation.notes}
          rows={4}
          className="rounded-md border px-3 py-2 text-sm"
          disabled={loading}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar cambios"}
        </button>
        <a
          href="/dashboard-seller/reservas"
          className="rounded-md border px-4 py-2 text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
