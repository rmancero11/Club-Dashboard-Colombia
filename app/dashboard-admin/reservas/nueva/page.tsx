"use client";

import { useMemo, useState } from "react";
import ReactSelect from "react-select";
import { getCurrencyOptions, type CurrencyOption } from "@/app/lib/currencyOptions";

type Opt = { id: string; name: string | null; email?: string | null; country?: string | null };
type StatusOpt = { value: string; label: string };

export default function NewReservationForm({
  sellers = [],
  clients = [],
  destinations = [],
  initialValues,
  statusOptions = [],
  // si te interesa, puedes seguir aceptando currencyOptions por props para sobreescribir;
  // de lo contrario, lo construiremos desde el helper.
  currencyOptions,
}: {
  sellers?: Opt[];
  clients?: Opt[];
  destinations?: Opt[];
  initialValues?: any;
  statusOptions?: StatusOpt[];
  currencyOptions?: CurrencyOption[];
}) {
  // opciones de moneda (del helper). Si vienen por props, las usamos; si no, generamos todas.
  const currencyOptionsAll = useMemo<CurrencyOption[]>(
    () => currencyOptions ?? getCurrencyOptions(),
    [currencyOptions]
  );

  const sellersSafe = sellers ?? [];
  const clientsSafe = clients ?? [];
  const destinationsSafe = destinations ?? [];
  const statusOptionsSafe = statusOptions ?? [];

  const [sellerId, setSellerId] = useState(initialValues?.sellerId ?? "");
  const [clientId, setClientId] = useState(initialValues?.clientId ?? "");
  const [destinationId, setDestinationId] = useState(initialValues?.destinationId ?? "");
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? "");
  const [paxAdults, setPaxAdults] = useState<number>(initialValues?.paxAdults ?? 1);
  const [paxChildren, setPaxChildren] = useState<number>(initialValues?.paxChildren ?? 0);
  const [currency, setCurrency] = useState<string>(initialValues?.currency ?? "USD");
  const [totalAmount, setTotalAmount] = useState(
    initialValues?.totalAmount !== undefined ? String(initialValues.totalAmount) : ""
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [status, setStatus] = useState<string>(initialValues?.status ?? "LEAD");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
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
          status,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "No se pudo crear");
      } else {
        window.location.replace(`/dashboard-admin/reservas/${data.reservation.id}`);
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  const selectedCurrency =
    currencyOptionsAll.find((o) => o.value === currency) || null;

  return (
    <div className="mx-auto max-w-2xl w-full">
      <form onSubmit={onSubmit} className="grid gap-3 w-full">
        {err && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Vendedor *</span>
            <select
              required
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="">Selecciona...</option>
              {sellersSafe.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Cliente *</span>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="">Selecciona...</option>
              {clientsSafe.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Destino *</span>
          <select
            required
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="rounded-md border px-3 py-2"
          >
            <option value="">Selecciona...</option>
            {destinationsSafe.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.country}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Inicio *</span>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Fin *</span>
            <input
              required
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
              inputId="currency"
              instanceId="currency"
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

        {statusOptionsSafe.length ? (
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              {statusOptionsSafe.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Notas</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <div className="flex gap-2 pt-2 justify-center">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear reserva"}
          </button>
          <a
            href="/dashboard-admin/reservas"
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
