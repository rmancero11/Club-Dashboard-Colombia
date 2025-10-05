"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: string; name: string | null; email?: string | null; country?: string | null };

export default function NewReservationForm({
  sellers, clients, destinations,
}: { sellers: Opt[]; clients: Opt[]; destinations: Opt[] }) {
  const [sellerId, setSellerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paxAdults, setPaxAdults] = useState(1);
  const [paxChildren, setPaxChildren] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sellerId, clientId, destinationId,
          startDate, endDate,
          paxAdults, paxChildren,
          currency,
          totalAmount: totalAmount ? Number(totalAmount) : 0,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "No se pudo crear");
      } else {
        router.replace(`/dashboard-admin/reservas/${data.reservation.id}`);
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
      {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Vendedor *</span>
          <select required value={sellerId} onChange={(e)=>setSellerId(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="">Selecciona...</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Cliente *</span>
          <select required value={clientId} onChange={(e)=>setClientId(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="">Selecciona...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Destino *</span>
        <select required value={destinationId} onChange={(e)=>setDestinationId(e.target.value)} className="rounded-md border px-3 py-2">
          <option value="">Selecciona...</option>
          {destinations.map(d => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Inicio *</span>
          <input required type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Fin *</span>
          <input required type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="rounded-md border px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Adultos</span>
          <input type="number" min={1} value={paxAdults} onChange={(e)=>setPaxAdults(parseInt(e.target.value,10)||1)} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Niños</span>
          <input type="number" min={0} value={paxChildren} onChange={(e)=>setPaxChildren(parseInt(e.target.value,10)||0)} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Moneda</span>
          <input value={currency} onChange={(e)=>setCurrency(e.target.value)} className="rounded-md border px-3 py-2" />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Total</span>
        <input type="number" step="0.01" value={totalAmount} onChange={(e)=>setTotalAmount(e.target.value)} className="rounded-md border px-3 py-2" />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Notas</span>
        <textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} className="rounded-md border px-3 py-2" />
      </label>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {loading ? "Creando..." : "Crear reserva"}
        </button>
        <a href="/dashboard-admin/reservas" className="rounded-md border px-4 py-2 text-sm">Cancelar</a>
      </div>
    </form>
  );
}
