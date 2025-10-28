"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TripDate = { startDate: string; endDate: string; isActive?: boolean; notes?: string };

const MEMBERSHIPS = ["STANDARD", "PREMIUM", "VIP"] as const;
type Membership = typeof MEMBERSHIPS[number];

type AirMode = "with" | "without";

/** Catálogo local de categorías (puedes traerlo del backend si quieres) */
const CATEGORIES: { slug: string; name: string }[] = [
  { slug: "playa", name: "Playa" },
  { slug: "aventura", name: "Aventura" },
  { slug: "cultura", name: "Cultura" },
  { slug: "mixto", name: "Mixto" },
];

/* ================= Helpers ================= */
type UINumber = number | "";

// Precio final = lista * (1 - d%)
const computeFinal = (list: UINumber, discount: UINumber): UINumber => {
  if (list === "" || Number(list) <= 0) return "";
  const d = discount === "" ? 0 : Number(discount);
  if (d < 0) return Number(list);
  const factor = 1 - d / 100;
  if (factor <= 0) return 0;
  return Number(list) * factor;
};

export default function NewDestinationPage() {
  const router = useRouter();

  // Básicos
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  // Membresía
  const [membership, setMembership] = useState<Membership>("STANDARD");

  // Categorías multi-select (por slug)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // ===== USD (una sola elección con/sin; se ingresa LISTA y se calcula FINAL) =====
  const [usdAirMode, setUsdAirMode] = useState<AirMode>("with");
  const [listUSD, setListUSD] = useState<number | "">("");         // Precio sin descuento (editable)
  const [discountUSD, setDiscountUSD] = useState<number | "">(""); // %
  const priceUSD = useMemo(() => computeFinal(listUSD, discountUSD), [listUSD, discountUSD]); // final (solo lectura)

  // ===== COP (una sola elección con/sin; se ingresa LISTA y se calcula FINAL) =====
  const [copAirMode, setCopAirMode] = useState<AirMode>("with");
  const [listCOP, setListCOP] = useState<number | "">("");         // Precio sin descuento (editable)
  const [discountCOP, setDiscountCOP] = useState<number | "">(""); // %
  const priceCOP = useMemo(() => computeFinal(listCOP, discountCOP), [listCOP, discountCOP]); // final (solo lectura)

  // Fechas
  const [tripDates, setTripDates] = useState<TripDate[]>([
    { startDate: "", endDate: "", isActive: true },
  ]);

  // Imagen
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Preview de imagen
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function setTripDate(idx: number, patch: Partial<TripDate>) {
    setTripDates((prev) => prev.map((td, i) => (i === idx ? { ...td, ...patch } : td)));
  }
  function addTripDate() {
    setTripDates((prev) => [...prev, { startDate: "", endDate: "", isActive: true }]);
  }
  function removeTripDate(idx: number) {
    setTripDates((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      // Validaciones mínimas (sobre LISTA y FINAL calculado)
      if (listUSD === "" || Number(listUSD) <= 0) {
        setErr("Ingresa el precio sin descuento en USD.");
        setLoading(false);
        return;
      }
      if (priceUSD === "" || Number(priceUSD) <= 0) {
        setErr("El precio final calculado en USD debe ser mayor a 0.");
        setLoading(false);
        return;
      }
      if (listCOP === "" || Number(listCOP) <= 0) {
        setErr("Ingresa el precio sin descuento en COP.");
        setLoading(false);
        return;
      }
      if (priceCOP === "" || Number(priceCOP) <= 0) {
        setErr("El precio final calculado en COP debe ser mayor a 0.");
        setLoading(false);
        return;
      }
      for (const td of tripDates) {
        if (!td.startDate || !td.endDate) {
          setErr("Completa todas las fechas de viaje (inicio y fin) o elimina las incompletas.");
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("country", country.trim());
      if (city) formData.append("city", city.trim());
      if (description) formData.append("description", description.trim());

      // Membresía
      formData.append("membership", membership);

      // Categorías (enviamos slugs)
      formData.append("categories", JSON.stringify(selectedCategories));

      // ===== Enviar columnas por modo, alineadas con el schema =====
      // USD - LISTA (sin descuento) y FINAL calculado + %
      if (usdAirMode === "with") {
        formData.append("listUSDWithAirfare", String(Number(listUSD).toFixed(2)));
        formData.append("priceUSDWithAirfare", String(Number(priceUSD).toFixed(2)));
        if (discountUSD !== "") formData.append("discountUSDWithAirfarePercent", String(Number(discountUSD)));
      } else {
        formData.append("listUSDWithoutAirfare", String(Number(listUSD).toFixed(2)));
        formData.append("priceUSDWithoutAirfare", String(Number(priceUSD).toFixed(2)));
        if (discountUSD !== "") formData.append("discountUSDWithoutAirfarePercent", String(Number(discountUSD)));
      }

      // COP - LISTA (sin descuento) y FINAL calculado + %
      // (en COP solemos guardar enteros para final y lista)
      if (copAirMode === "with") {
        formData.append("listCOPWithAirfare", String(Math.round(Number(listCOP))));
        formData.append("priceCOPWithAirfare", String(Math.round(Number(priceCOP))));
        if (discountCOP !== "") formData.append("discountCOPWithAirfarePercent", String(Number(discountCOP)));
      } else {
        formData.append("listCOPWithoutAirfare", String(Math.round(Number(listCOP))));
        formData.append("priceCOPWithoutAirfare", String(Math.round(Number(priceCOP))));
        if (discountCOP !== "") formData.append("discountCOPWithoutAirfarePercent", String(Number(discountCOP)));
      }

      // Fechas
      formData.append("tripDates", JSON.stringify(tripDates));

      // Imagen
      if (image) formData.append("image", image);

      const res = await fetch("/api/admin/destinations", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.error || "No se pudo crear el destino");
      } else {
        setMsg("Destino creado.");
        if (data?.destination?.id) {
          router.replace(`/dashboard-admin/destinos/${data.destination.id}`);
        } else {
          router.replace(`/dashboard-admin/destinos`);
        }
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full min-w-0 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10";
  const labelClass = "flex flex-col gap-1 text-sm";

  const Radio = ({
    name, value, checked, onChange, label,
  }: { name: string; value: string; checked: boolean; onChange: () => void; label: string }) => (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {label}
    </label>
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Nuevo destino</h1>
        <a
          href="/dashboard-admin/destinos"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Volver
        </a>
      </header>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm grid gap-4">
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

        {/* Nombre */}
        <label className={labelClass}>
          <span className="font-medium">Nombre *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Cancún"
          />
        </label>

        {/* País / Ciudad */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className="font-medium">País *</span>
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
              placeholder="México"
            />
          </label>
          <label className={labelClass}>
            <span className="font-medium">Ciudad</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
              placeholder="Quintana Roo"
            />
          </label>
        </div>

        {/* Membresía */}
        <label className={labelClass}>
          <span className="font-medium">Membresía requerida</span>
          <select
            value={membership}
            onChange={(e) => setMembership(e.target.value as Membership)}
            className={inputClass}
          >
            {MEMBERSHIPS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            Define qué plan puede ver/comprar este destino (por defecto STANDARD).
          </span>
        </label>

        {/* Categorías (multi-select) */}
        <label className={labelClass}>
          <span className="font-medium">Categorías</span>
          <select
            multiple
            value={selectedCategories}
            onChange={(e) => {
              const vals = Array.from(e.target.selectedOptions).map(o => o.value);
              setSelectedCategories(vals);
            }}
            className={`${inputClass} h-28`}
          >
            {CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar varias.
          </span>
        </label>

        {/* Descripción */}
        <label className={labelClass}>
          <span className="font-medium">Descripción</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Un paraíso tropical..."
          />
        </label>

        {/* ===================== PRECIOS USD ===================== */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">Precios en U$D</h3>

          {/* Precio sin descuento (editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={labelClass}>
              <span className="font-medium">Precio sin descuento (U$D) *</span>
              <input
                type="number"
                step="0.01"
                value={listUSD}
                onChange={(e)=>setListUSD(e.target.value==="" ? "" : Number(e.target.value))}
                className={inputClass}
                placeholder="1666.67"
                min="0"
                required
              />
            </label>
            <label className={labelClass}>
              <span className="font-medium">Descuento (%)</span>
              <input
                type="number"
                step="0.01"
                value={discountUSD}
                onChange={(e)=>setDiscountUSD(e.target.value==="" ? "" : Number(e.target.value))}
                className={inputClass}
                placeholder="10"
                min="0"
              />
            </label>
          </div>

          {/* Precio final derivado (solo lectura) */}
          <label className={labelClass}>
            <span className="font-medium">Precio final en U$D (calculado)</span>
            <input
              type="number"
              readOnly
              value={priceUSD === "" ? "" : Number(priceUSD).toFixed(2)}
              className={`${inputClass} bg-gray-50`}
              placeholder="—"
            />
            <span className="text-xs text-gray-500">Se calcula como: lista × (1 - %/100).</span>
          </label>

          {/* Modo con/sin aéreo */}
          <div className="flex items-center gap-6 pt-1">
            <Radio name="usdAirMode" value="with" checked={usdAirMode==="with"} onChange={()=>setUsdAirMode("with")} label="Con aéreo" />
            <Radio name="usdAirMode" value="without" checked={usdAirMode==="without"} onChange={()=>setUsdAirMode("without")} label="Sin aéreo" />
          </div>
        </div>

        {/* ===================== PRECIOS COP ===================== */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">Precios en COP</h3>

          {/* Precio sin descuento (editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={labelClass}>
              <span className="font-medium">Precio sin descuento (COP) *</span>
              <input
                type="number"
                step="1"
                value={listCOP}
                onChange={(e)=>setListCOP(e.target.value==="" ? "" : Number(e.target.value))}
                className={inputClass}
                placeholder="6666666"
                min="0"
                required
              />
            </label>
            <label className={labelClass}>
              <span className="font-medium">Descuento (%)</span>
              <input
                type="number"
                step="0.01"
                value={discountCOP}
                onChange={(e)=>setDiscountCOP(e.target.value==="" ? "" : Number(e.target.value))}
                className={inputClass}
                placeholder="10"
                min="0"
              />
            </label>
          </div>

          {/* Precio final derivado (solo lectura) */}
          <label className={labelClass}>
            <span className="font-medium">Precio final en COP (calculado)</span>
            <input
              type="number"
              readOnly
              value={priceCOP === "" ? "" : Math.round(Number(priceCOP))}
              className={`${inputClass} bg-gray-50`}
              placeholder="—"
            />
            <span className="text-xs text-gray-500">Se calcula como: lista × (1 - %/100). Se redondea al entero más cercano.</span>
          </label>

          {/* Modo con/sin aéreo */}
          <div className="flex items-center gap-6 pt-1">
            <Radio name="copAirMode" value="with" checked={copAirMode==="with"} onChange={()=>setCopAirMode("with")} label="Con aéreo" />
            <Radio name="copAirMode" value="without" checked={copAirMode==="without"} onChange={()=>setCopAirMode("without")} label="Sin aéreo" />
          </div>
        </div>

        {/* Fechas (múltiples) */}
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
                <label className={labelClass}>
                  <span className="text-xs">Inicio *</span>
                  <input
                    type="date"
                    value={td.startDate}
                    onChange={(e) => setTripDate(idx, { startDate: e.target.value })}
                    className={inputClass}
                    required
                  />
                </label>
                <label className={labelClass}>
                  <span className="text-xs">Fin *</span>
                  <input
                    type="date"
                    value={td.endDate}
                    onChange={(e) => setTripDate(idx, { endDate: e.target.value })}
                    className={inputClass}
                    required
                  />
                </label>
                <label className={labelClass}>
                  <span className="text-xs">Activa</span>
                  <select
                    value={td.isActive ? "1" : "0"}
                    onChange={(e) => setTripDate(idx, { isActive: e.target.value === "1" })}
                    className={inputClass}
                  >
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
                <label className={`sm:col-span-2 ${labelClass}`}>
                  <span className="text-xs">Notas</span>
                  <input
                    value={td.notes || ""}
                    onChange={(e) => setTripDate(idx, { notes: e.target.value })}
                    className={inputClass}
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

        {/* Imagen */}
        <div className="grid gap-2">
          <label className={labelClass}>
            <span className="font-medium">Imagen</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full min-w-0 rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:text-gray-700 hover:file:bg-gray-200"
            />
            <span className="text-xs text-gray-500">
              Selecciona una imagen para previsualizarla antes de guardar.
            </span>
          </label>

          {preview && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Vista previa</p>
              <div className="overflow-hidden rounded-md border">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="block h-auto max-h-72 w-full object-cover"
                />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                  }}
                  className="text-xs text-gray-700 underline"
                >
                  Quitar selección
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear destino"}
          </button>
          <a
            href="/dashboard-admin/destinos"
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
