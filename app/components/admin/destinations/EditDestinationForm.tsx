"use client";

import { useEffect, useMemo, useState } from "react";

/* ================== Tipos ================== */

type UINumber = number | "";
type Membership = "STANDARD" | "PREMIUM" | "VIP";

type CategoryLite = { name: string; slug: string };

// Fechas que llegan del servidor (Prisma) pueden venir como Date
type TripDateFromServer = {
  id?: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

// Fechas en el estado de UI deben ser strings (yyyy-mm-dd) para inputs date
type TripDateState = {
  id?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes?: string;
};

type Dest = {
  id: string;
  name: string;
  country: string;
  city?: string | null;
  description?: string | null;
  imageUrl?: string | null;

  membership: Membership;
  categories: CategoryLite[];

  // Valores existentes en BD (formato anterior con 4 campos):
  priceUSDWithAirfare: UINumber;
  priceUSDWithoutAirfare: UINumber;
  priceCOPWithAirfare: UINumber;
  priceCOPWithoutAirfare: UINumber;

  baseFromUSD?: UINumber;
  baseFromCOP?: UINumber;

  tripDates: TripDateFromServer[];
};

/* ================== Catálogo de categorías (puedes moverlo a BD) ================== */
const CATEGORIES: { slug: string; name: string }[] = [
  { slug: "playa", name: "Playa" },
  { slug: "aventura", name: "Aventura" },
  { slug: "cultura", name: "Cultura" },
  { slug: "mixto", name: "Mixto" },
];

/* ================== Helpers ================== */

const toDateInput = (v: string | Date | undefined) => {
  if (!v) return "";
  return typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
};

const sameStr = (a?: string | null, b?: string | null) => (a ?? "") === (b ?? "");
const trimOrEmpty = (v: string) => v.trim();
const toNumStr = (v: UINumber) => (v === "" ? "" : String(v));
const sameNumStr = (a: UINumber, b: UINumber) => toNumStr(a) === toNumStr(b);

/* ================== Componente ================== */

export default function EditDestinationForm({ dest }: { dest: Dest }) {
  // ====== Estado básico
  const [name, setName] = useState(dest.name);
  const [country, setCountry] = useState(dest.country);
  const [city, setCity] = useState(dest.city ?? "");
  const [description, setDescription] = useState(dest.description ?? "");
  const [membership, setMembership] = useState<Membership>(dest.membership);

  // ====== Categorías (multi select por slug)
  const initialSelectedCats = useMemo(
    () => (dest.categories || []).map((c) => c.slug),
    [dest.categories]
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCats);

  // Para comparar cambios de categorías
  const categoriesEqual = useMemo(() => {
    const a = [...initialSelectedCats].sort();
    const b = [...selectedCategories].sort();
    return JSON.stringify(a) === JSON.stringify(b);
  }, [initialSelectedCats, selectedCategories]);

  // ====== Precios – nuevo modelo (una sola variante por moneda, sin precio base)
  type AirMode = "with" | "without";

  const initialUsdMode: AirMode = (dest.priceUSDWithAirfare !== "" && Number(dest.priceUSDWithAirfare) > 0)
    ? "with"
    : "without";
  const initialUsdPrice: UINumber =
    initialUsdMode === "with" ? dest.priceUSDWithAirfare : dest.priceUSDWithoutAirfare;

  const initialCopMode: AirMode = (dest.priceCOPWithAirfare !== "" && Number(dest.priceCOPWithAirfare) > 0)
    ? "with"
    : "without";
  const initialCopPrice: UINumber =
    initialCopMode === "with" ? dest.priceCOPWithAirfare : dest.priceCOPWithoutAirfare;

  const [usdAirMode, setUsdAirMode] = useState<AirMode>(initialUsdMode);
  const [priceUSD, setPriceUSD] = useState<UINumber>(initialUsdPrice ?? "");
  const [discountUSD, setDiscountUSD] = useState<UINumber>(""); // opcional, informativo

  const [copAirMode, setCopAirMode] = useState<AirMode>(initialCopMode);
  const [priceCOP, setPriceCOP] = useState<UINumber>(initialCopPrice ?? "");
  const [discountCOP, setDiscountCOP] = useState<UINumber>(""); // opcional, informativo

  // “Desde”
  const [baseFromUSD, setBaseFromUSD] = useState<UINumber>(dest.baseFromUSD ?? "");
  const [baseFromCOP, setBaseFromCOP] = useState<UINumber>(dest.baseFromCOP ?? "");

  // ====== TripDates (convertimos a strings para inputs date)
  const [tripDates, setTripDates] = useState<TripDateState[]>(
    (dest.tripDates || []).map((td) => ({
      id: td.id,
      startDate: toDateInput(td.startDate),
      endDate: toDateInput(td.endDate),
      isActive: td.isActive,
      notes: td.notes ?? "",
    }))
  );

  function setTripDate(idx: number, patch: Partial<TripDateState>) {
    setTripDates((prev) => prev.map((td, i) => (i === idx ? { ...td, ...patch } : td)));
  }
  function addTripDate() {
    setTripDates((prev) => [...prev, { startDate: "", endDate: "", isActive: true, notes: "" }]);
  }
  function removeTripDate(idx: number) {
    setTripDates((prev) => prev.filter((_, i) => i !== idx));
  }

  const tripDatesEqual = useMemo(() => {
    const normA = (dest.tripDates || []).map((td) => ({
      id: td.id || "",
      s: toDateInput(td.startDate),
      e: toDateInput(td.endDate),
      a: !!td.isActive,
      n: (td.notes || "").trim(),
    }));
    const normB = (tripDates || []).map((td) => ({
      id: td.id || "",
      s: td.startDate,
      e: td.endDate,
      a: !!td.isActive,
      n: (td.notes || "").trim(),
    }));
    return JSON.stringify(normA) === JSON.stringify(normB);
  }, [dest.tripDates, tripDates]);

  // ====== Imagen (si decides añadir en esta pantalla puedes reusar tu lógica previa)
  // (omito imagen aquí porque el snippet original no incluía update de imagen)

  // ====== UI
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ====== Submit
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      // Validaciones simples
      if (priceUSD === "" || Number(priceUSD) <= 0) {
        setErrorMsg("Ingresa el precio final en USD.");
        setSaving(false);
        return;
      }
      if (priceCOP === "" || Number(priceCOP) <= 0) {
        setErrorMsg("Ingresa el precio final en COP.");
        setSaving(false);
        return;
      }
      for (const td of tripDates) {
        if (!td.startDate || !td.endDate) {
          setErrorMsg("Completa inicio y fin en todas las salidas o elimina las incompletas.");
          setSaving(false);
          return;
        }
      }

      const fd = new FormData();
      let hasChanges = false;
      const setChange = (key: string, val: string | Blob) => {
        fd.set(key, val as any);
        hasChanges = true;
      };

      // Básicos
      if (!sameStr(dest.name, name)) setChange("name", trimOrEmpty(name));
      if (!sameStr(dest.country, country)) setChange("country", trimOrEmpty(country));
      if (!sameStr(dest.city ?? "", city)) setChange("city", trimOrEmpty(city));
      if (!sameStr(dest.description ?? "", description)) setChange("description", trimOrEmpty(description));

      // Membresía
      if (dest.membership !== membership) setChange("membership", membership);

      // Categorías
      if (!categoriesEqual) setChange("categories", JSON.stringify(selectedCategories));

      // ===== Precios (nuevo modelo de edición)
      // Comparamos contra el valor previo que estaba "activo" por cada moneda
      if (usdAirMode !== initialUsdMode) setChange("usdAirMode", usdAirMode);
      if (!sameNumStr(initialUsdPrice, priceUSD)) setChange("priceUSD", toNumStr(priceUSD));
      if (discountUSD !== "") setChange("discountUSD", toNumStr(discountUSD)); // opcional

      if (copAirMode !== initialCopMode) setChange("copAirMode", copAirMode);
      if (!sameNumStr(initialCopPrice, priceCOP)) setChange("priceCOP", toNumStr(priceCOP));
      if (discountCOP !== "") setChange("discountCOP", toNumStr(discountCOP)); // opcional

      // “Desde”
      if (!sameNumStr(dest.baseFromUSD ?? "", baseFromUSD)) setChange("baseFromUSD", toNumStr(baseFromUSD));
      if (!sameNumStr(dest.baseFromCOP ?? "", baseFromCOP)) setChange("baseFromCOP", toNumStr(baseFromCOP));

      // TripDates
      if (!tripDatesEqual) {
        setChange("tripDates", JSON.stringify(tripDates));
      }

      if (!hasChanges) {
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/destinations/${dest.id}`, {
        method: "PATCH",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error || "No se pudo actualizar el destino");
        return;
      }

      location.reload();
    } catch {
      setErrorMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  /* ================== UI ================== */

  const inputBase =
    "rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10";
  const labelBase = "grid gap-1 text-sm";

  const Radio = ({
    name,
    value,
    checked,
    onChange,
    label,
  }: {
    name: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {label}
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      {errorMsg && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Nombre */}
      <label className={labelBase}>
        <span className="font-medium">Nombre *</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputBase} />
      </label>

      {/* País / Ciudad */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">País *</span>
          <input required value={country} onChange={(e) => setCountry(e.target.value)} className={inputBase} />
        </label>

        <label className={labelBase}>
          <span className="font-medium">Ciudad</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputBase} />
        </label>
      </div>

      {/* Membresía */}
      <label className={labelBase}>
        <span className="font-medium">Membresía requerida</span>
        <select value={membership} onChange={(e) => setMembership(e.target.value as Membership)} className={inputBase}>
          <option value="STANDARD">STANDARD</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="VIP">VIP</option>
        </select>
        <span className="text-xs text-gray-500">Define qué plan puede ver/comprar este destino.</span>
      </label>

      {/* Categorías (multi-select) */}
      <label className={labelBase}>
        <span className="font-medium">Categorías</span>
        <select
          multiple
          value={selectedCategories}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
            setSelectedCategories(opts);
          }}
          className={`${inputBase} h-28`}
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar varias.
        </span>
      </label>

      {/* ===================== BLOQUE PRECIOS USD (sin precio base) ===================== */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Precios en U$D</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelBase}>
            <span className="font-medium">Descuento (%)</span>
            <input
              type="number"
              step="0.01"
              value={discountUSD}
              onChange={(e) => setDiscountUSD(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputBase}
              placeholder="0"
              min="0"
            />
          </label>
          <label className={labelBase}>
            <span className="font-medium">Precio final en U$D *</span>
            <input
              type="number"
              step="0.01"
              value={priceUSD}
              onChange={(e) => setPriceUSD(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputBase}
              placeholder="1499"
              min="0"
              required
            />
          </label>
        </div>

        {/* Radios DEBAJO de descuento y precio final */}
        <div className="flex items-center gap-6 pt-1">
          <Radio
            name="usdAirMode"
            value="with"
            checked={usdAirMode === "with"}
            onChange={() => setUsdAirMode("with")}
            label="Con aéreo"
          />
          <Radio
            name="usdAirMode"
            value="without"
            checked={usdAirMode === "without"}
            onChange={() => setUsdAirMode("without")}
            label="Sin aéreo"
          />
        </div>
      </div>

      {/* ===================== BLOQUE PRECIOS COP (sin precio base) ===================== */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Precios en COP</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelBase}>
            <span className="font-medium">Descuento (%)</span>
            <input
              type="number"
              step="0.01"
              value={discountCOP}
              onChange={(e) => setDiscountCOP(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputBase}
              placeholder="0"
              min="0"
            />
          </label>
          <label className={labelBase}>
            <span className="font-medium">Precio final en COP *</span>
            <input
              type="number"
              step="1"
              value={priceCOP}
              onChange={(e) => setPriceCOP(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputBase}
              placeholder="5800000"
              min="0"
              required
            />
          </label>
        </div>

        {/* Radios DEBAJO de descuento y precio final */}
        <div className="flex items-center gap-6 pt-1">
          <Radio
            name="copAirMode"
            value="with"
            checked={copAirMode === "with"}
            onChange={() => setCopAirMode("with")}
            label="Con aéreo"
          />
          <Radio
            name="copAirMode"
            value="without"
            checked={copAirMode === "without"}
            onChange={() => setCopAirMode("without")}
            label="Sin aéreo"
          />
        </div>
      </div>

      {/* “Desde” (opcionales, sin cambios) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">Desde USD (opcional)</span>
          <input
            type="number"
            step="0.01"
            value={baseFromUSD}
            onChange={(e) => setBaseFromUSD(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputBase}
            placeholder="999"
          />
        </label>
        <label className={labelBase}>
          <span className="font-medium">Desde COP (opcional)</span>
          <input
            type="number"
            step="1"
            value={baseFromCOP}
            onChange={(e) => setBaseFromCOP(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputBase}
            placeholder="3900000"
          />
        </label>
      </div>

      {/* Fechas de viaje */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Fechas de viaje</span>
          <button
            type="button"
            onClick={addTripDate}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            + Añadir salida
          </button>
        </div>

        <div className="grid gap-3">
          {tripDates.map((td, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 rounded-md border p-3">
              <label className={labelBase}>
                <span className="text-xs">Inicio *</span>
                <input
                  type="date"
                  value={td.startDate}
                  onChange={(e) => setTripDate(idx, { startDate: e.target.value })}
                  className={inputBase}
                />
              </label>
              <label className={labelBase}>
                <span className="text-xs">Fin *</span>
                <input
                  type="date"
                  value={td.endDate}
                  onChange={(e) => setTripDate(idx, { endDate: e.target.value })}
                  className={inputBase}
                />
              </label>
              <label className={labelBase}>
                <span className="text-xs">Activa</span>
                <select
                  value={td.isActive ? "1" : "0"}
                  onChange={(e) => setTripDate(idx, { isActive: e.target.value === "1" })}
                  className={inputBase}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </label>
              <label className={`sm:col-span-2 ${labelBase}`}>
                <span className="text-xs">Notas</span>
                <input
                  value={td.notes || ""}
                  onChange={(e) => setTripDate(idx, { notes: e.target.value })}
                  className={inputBase}
                  placeholder="Semana Santa, cupos, etc."
                />
              </label>
              <div className="sm:col-span-5">
                <button
                  type="button"
                  onClick={() => removeTripDate(idx)}
                  className="text-xs text-gray-700 underline"
                >
                  Eliminar esta salida
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
