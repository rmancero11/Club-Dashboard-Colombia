"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function HomeDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Leer valores actuales desde la URL (si existen)
  const urlFrom = sp.get("from");
  const urlTo = sp.get("to");
  const urlAsOf = sp.get("asOf"); // compatibilidad con tu modo anterior

  // Fallback cuando no hay from/to:
  // - si hay asOf => [inicio de mes de asOf, asOf]
  // - si nada => [inicio de mes actual, hoy]
  const defaults = useMemo(() => {
    if (urlFrom && urlTo) return { from: urlFrom, to: urlTo };
    if (urlAsOf) {
      const [y, m, d] = urlAsOf.split("-").map(Number);
      const asOf = new Date(y, (m ?? 1) - 1, d ?? 1);
      const from = toYmd(startOfMonth(asOf));
      const to = toYmd(asOf);
      return { from, to };
    }
    return { from: toYmd(startOfMonth(new Date())), to: toYmd(new Date()) };
  }, [urlFrom, urlTo, urlAsOf]);

  const [from, setFrom] = useState<string>(defaults.from);
  const [to, setTo] = useState<string>(defaults.to);

  // Si cambian los searchParams externamente, sincroniza los inputs
  useEffect(() => {
    if (urlFrom && urlTo) {
      setFrom(urlFrom);
      setTo(urlTo);
      return;
    }
    // Si hay asOf, derivar rango
    if (urlAsOf) {
      const [y, m, d] = urlAsOf.split("-").map(Number);
      const asOf = new Date(y, (m ?? 1) - 1, d ?? 1);
      setFrom(toYmd(startOfMonth(asOf)));
      setTo(toYmd(asOf));
      return;
    }
    // Fallback por defecto
    setFrom(toYmd(startOfMonth(new Date())));
    setTo(toYmd(new Date()));
  }, [urlFrom, urlTo, urlAsOf]);

  function apply() {
    if (!from || !to) return;
    // Corrige si el usuario invierte las fechas
    const f = new Date(from);
    const t = new Date(to);
    const [a, b] = f > t ? [toYmd(t), toYmd(f)] : [from, to];

    const params = new URLSearchParams(sp.toString());
    params.set("from", a);
    params.set("to", b);
    // Eliminamos asOf para evitar conflictos
    params.delete("asOf");

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearRange() {
    const params = new URLSearchParams(sp.toString());
    params.delete("from");
    params.delete("to");
    // Si quieres limpiar también asOf:
    params.delete("asOf");
    router.push(`${pathname}?${params.toString()}`);
  }

  // Atajos rápidos (opcional)
  function quickThisMonth() {
    const a = toYmd(startOfMonth(new Date()));
    const b = toYmd(new Date());
    setFrom(a);
    setTo(b);
    const params = new URLSearchParams(sp.toString());
    params.set("from", a);
    params.set("to", b);
    params.delete("asOf");
    router.push(`${pathname}?${params.toString()}`);
  }

  function quickLast7() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const a = toYmd(start);
    const b = toYmd(end);
    setFrom(a);
    setTo(b);
    const params = new URLSearchParams(sp.toString());
    params.set("from", a);
    params.set("to", b);
    params.delete("asOf");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Desde</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Hasta</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={apply}
          className="rounded-md border bg-black px-3 py-1 text-sm text-white hover:opacity-90"
        >
          Aplicar
        </button>
        <button
          onClick={clearRange}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Limpiar
        </button>
      </div>

      {/* Atajos opcionales */}
      <div className="flex items-center gap-2">
        <button
          onClick={quickThisMonth}
          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
          title="Primer día de este mes hasta hoy"
        >
          Este mes
        </button>
        <button
          onClick={quickLast7}
          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
          title="Últimos 7 días (incluye hoy)"
        >
          Últimos 7 días
        </button>
      </div>
    </div>
  );
}
