"use client";

import { useMemo, useState } from "react";
import ReactSelect from "react-select";
import { getCurrencyOptions, type CurrencyOption } from "@/app/lib/currencyOptions";

type Opt = { id: string; name: string | null; email?: string | null; country?: string | null };

// Helpers para timeline
function parseTimelineSafe(raw?: string) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function EditReservationForm({
  reservation,
  sellers,
  clients,
  destinations,
  currencyOptions, // opcional: permite inyectar opciones personalizadas si quieres
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
    notes: string; // JSON string (timeline) o texto legacy
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
  const [notes, setNotes] = useState(reservation.notes || ""); // se enviará como JSON string si hay timeline
  const [saving, setSaving] = useState(false);

  // Opciones de moneda (de librería)
  const currencyOptionsAll = useMemo<CurrencyOption[]>(
    () => currencyOptions ?? getCurrencyOptions(),
    [currencyOptions]
  );
  const selectedCurrency =
    currencyOptionsAll.find((o) => o.value === currency) || null;

  // Timeline en memoria
  const [timeline, setTimeline] = useState<
    Array<{ ts: string; text: string; author?: string; type?: string }>
  >(() => parseTimelineSafe(reservation.notes));

  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);

  function addNoteToTimeline() {
    const text = newNote.trim();
    if (!text) return;
    setAdding(true);
    const entry = {
      ts: new Date().toISOString(),
      text,
      author: "Sistema", // reemplaza con el nombre del usuario si lo pasas por props
      type: "NOTE",
    };
    const next = [...timeline, entry];
    setTimeline(next);
    setNotes(JSON.stringify(next)); // sincroniza con el cuerpo del PATCH
    setNewNote("");
    setAdding(false);
  }

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
          // Enviamos notes como JSON string (timeline) o null
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
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-3">
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

      {/* ---- Agregar nota al timeline ---- */}
      <div className="rounded-lg border p-3">
        <div className="mb-2 text-sm font-medium">Agregar nota</div>
        <div className="grid gap-2">
          <textarea
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Escribe una nota…"
          />
          <div>
            <button
              type="button"
              onClick={addNoteToTimeline}
              disabled={adding || !newNote.trim()}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            >
              {adding ? "Agregando…" : "Agregar"}
            </button>
          </div>
        </div>

        {/* Vista previa del timeline actual */}
        <div className="mt-3">
          <div className="mb-1 text-xs text-gray-500">Vista previa</div>
          {timeline.length === 0 ? (
            <div className="rounded-md border p-2 text-xs text-gray-400">Sin eventos</div>
          ) : (
            <ol className="relative ml-3 border-l pl-4">
              {timeline.map((it, i) => (
                <li key={`${it.ts}-${i}`} className="mb-3">
                  <div className="absolute -left-1.5 mt-1.5 h-2 w-2 rounded-full bg-gray-300" />
                  <div className="text-[11px] text-gray-400">
                    {new Date(it.ts).toLocaleString("es-CO")} · {it.author || "Sistema"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">
                    {it.type === "NOTE" ? "Nota" : it.type}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{it.text}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

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
