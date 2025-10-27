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

const asNumber = (v: UINumber) => (v === "" ? 0 : Number(v));
const calcFinal = (base: UINumber, discountPct: UINumber) => {
  const b = asNumber(base);
  const d = asNumber(discountPct);
  if (!isFinite(b) || !isFinite(d)) return "";
  const f = b * (1 - d / 100);
  return Number.isFinite(f) ? Number(f.toFixed(2)) : "";
};

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

  // ====== Precios – modo (con/sin) por moneda
  type AirMode = "with" | "without";
  const [usdMode, setUsdMode] = useState<AirMode>("with");
  const [copMode, setCopMode] = useState<AirMode>("with");

  // Bases y descuentos por variante
  const [usdBaseWith, setUsdBaseWith] = useState<UINumber>(dest.priceUSDWithAirfare ?? "");
  const [usdDiscWith, setUsdDiscWith] = useState<UINumber>("");
  const [usdBaseWithout, setUsdBaseWithout] = useState<UINumber>(dest.priceUSDWithoutAirfare ?? "");
  const [usdDiscWithout, setUsdDiscWithout] = useState<UINumber>("");

  const [copBaseWith, setCopBaseWith] = useState<UINumber>(dest.priceCOPWithAirfare ?? "");
  const [copDiscWith, setCopDiscWith] = useState<UINumber>("");
  const [copBaseWithout, setCopBaseWithout] = useState<UINumber>(dest.priceCOPWithoutAirfare ?? "");
  const [copDiscWithout, setCopDiscWithout] = useState<UINumber>("");

  // Finales calculados
  const usdFinalWith = useMemo(() => calcFinal(usdBaseWith, usdDiscWith), [usdBaseWith, usdDiscWith]);
  const usdFinalWithout = useMemo(() => calcFinal(usdBaseWithout, usdDiscWithout), [usdBaseWithout, usdDiscWithout]);
  const copFinalWith = useMemo(() => calcFinal(copBaseWith, copDiscWith), [copBaseWith, copDiscWith]);
  const copFinalWithout = useMemo(
    () => calcFinal(copBaseWithout, copDiscWithout),
    [copBaseWithout, copDiscWithout]
  );

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

  // ====== Imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage] = useState(dest.imageUrl || "");
  const [newPreview, setNewPreview] = useState<string>("");

  useEffect(() => {
    if (!imageFile) {
      setNewPreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setNewPreview((e.target?.result as string) || "");
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

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

      // Categorías (enviamos array de slugs)
      if (!categoriesEqual) setChange("categories", JSON.stringify(selectedCategories));

      // Precios: guardamos FINALES por cada variante
      const finalUSDWith = usdFinalWith;
      const finalUSDWithout = usdFinalWithout;
      const finalCOPWith = copFinalWith;
      const finalCOPWithout = copFinalWithout;

      if (!sameNumStr(dest.priceUSDWithAirfare, finalUSDWith))
        setChange("priceUSDWithAirfare", toNumStr(finalUSDWith));
      if (!sameNumStr(dest.priceUSDWithoutAirfare, finalUSDWithout))
        setChange("priceUSDWithoutAirfare", toNumStr(finalUSDWithout));
      if (!sameNumStr(dest.priceCOPWithAirfare, finalCOPWith))
        setChange("priceCOPWithAirfare", toNumStr(finalCOPWith));
      if (!sameNumStr(dest.priceCOPWithoutAirfare, finalCOPWithout))
        setChange("priceCOPWithoutAirfare", toNumStr(finalCOPWithout));

      if (!sameNumStr(dest.baseFromUSD ?? "", baseFromUSD)) setChange("baseFromUSD", toNumStr(baseFromUSD));
      if (!sameNumStr(dest.baseFromCOP ?? "", baseFromCOP)) setChange("baseFromCOP", toNumStr(baseFromCOP));

      // TripDates
      if (!tripDatesEqual) {
        for (const td of tripDates) {
          if (!td.startDate || !td.endDate) {
            setSaving(false);
            setErrorMsg("Completa inicio y fin en todas las salidas o elimina las incompletas.");
            return;
          }
        }
        setChange("tripDates", JSON.stringify(tripDates));
      }

      // Imagen
      if (imageFile) setChange("image", imageFile);

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

  // Helpers UI para bloques de precio
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

      {/* Imagen actual */}
      {dest.imageUrl && (
        <div className="mb-2">
          <p className="mb-2 text-sm font-medium text-gray-700">Imagen actual</p>
          <img
            src={dest.imageUrl}
            alt={`Imagen actual de ${name}`}
            className="w-full rounded-md object-cover max-h-48 border"
          />
        </div>
      )}

      {/* Nueva imagen */}
      <label className={labelBase}>
        <span className="font-medium">Cambiar imagen</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className={`${inputBase} file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:text-gray-700 hover:file:bg-gray-200`}
        />
        <span className="text-xs text-gray-500">
          Selecciona un archivo para previsualizarlo antes de guardar.
        </span>
      </label>

      {/* Preview nueva imagen */}
      {newPreview && (
        <div className="mt-2">
          <p className="mb-2 text-sm font-medium text-gray-700">Vista previa de la nueva imagen</p>
          <img
            src={newPreview}
            alt="Vista previa nueva"
            className="w-full rounded-md object-cover max-h-48 border"
          />
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setNewPreview("");
              }}
              className="text-xs text-gray-700 underline"
            >
              Quitar selección
            </button>
          </div>
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

      {/* ===================== BLOQUE PRECIOS USD ===================== */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Precios en U$D</h3>

        <div className="flex items-center gap-6">
          <Radio
            name="usdMode"
            value="with"
            checked={usdMode === "with"}
            onChange={() => setUsdMode("with")}
            label="Con aéreo"
          />
          <Radio
            name="usdMode"
            value="without"
            checked={usdMode === "without"}
            onChange={() => setUsdMode("without")}
            label="Sin aéreo"
          />
        </div>

        {usdMode === "with" ? (
          <>
            <label className={labelBase}>
              <span className="font-medium">Precio base</span>
              <input
                type="number"
                step="0.01"
                value={usdBaseWith}
                onChange={(e) => setUsdBaseWith(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputBase}
                placeholder="1499"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelBase}>
                <span className="font-medium">Descuento (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={usdDiscWith}
                  onChange={(e) => setUsdDiscWith(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputBase}
                  placeholder="0"
                />
              </label>
              <label className={labelBase}>
                <span className="font-medium">Precio final en U$D</span>
                <input type="number" disabled value={usdFinalWith} className={inputBase} />
              </label>
            </div>
          </>
        ) : (
          <>
            <label className={labelBase}>
              <span className="font-medium">Precio base</span>
              <input
                type="number"
                step="0.01"
                value={usdBaseWithout}
                onChange={(e) => setUsdBaseWithout(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputBase}
                placeholder="999"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelBase}>
                <span className="font-medium">Descuento (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={usdDiscWithout}
                  onChange={(e) => setUsdDiscWithout(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputBase}
                  placeholder="0"
                />
              </label>
              <label className={labelBase}>
                <span className="font-medium">Precio final en U$D</span>
                <input type="number" disabled value={usdFinalWithout} className={inputBase} />
              </label>
            </div>
          </>
        )}
      </div>

      {/* ===================== BLOQUE PRECIOS COP ===================== */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Precios en COP</h3>

        <div className="flex items-center gap-6">
          <Radio
            name="copMode"
            value="with"
            checked={copMode === "with"}
            onChange={() => setCopMode("with")}
            label="Con aéreo"
          />
          <Radio
            name="copMode"
            value="without"
            checked={copMode === "without"}
            onChange={() => setCopMode("without")}
            label="Sin aéreo"
          />
        </div>

        {copMode === "with" ? (
          <>
            <label className={labelBase}>
              <span className="font-medium">Precio base</span>
              <input
                type="number"
                step="1"
                value={copBaseWith}
                onChange={(e) => setCopBaseWith(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputBase}
                placeholder="5800000"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelBase}>
                <span className="font-medium">Descuento (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={copDiscWith}
                  onChange={(e) => setCopDiscWith(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputBase}
                  placeholder="0"
                />
              </label>
              <label className={labelBase}>
                <span className="font-medium">Precio final en COP</span>
                <input type="number" disabled value={copFinalWith} className={inputBase} />
              </label>
            </div>
          </>
        ) : (
          <>
            <label className={labelBase}>
              <span className="font-medium">Precio base</span>
              <input
                type="number"
                step="1"
                value={copBaseWithout}
                onChange={(e) => setCopBaseWithout(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputBase}
                placeholder="3900000"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelBase}>
                <span className="font-medium">Descuento (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={copDiscWithout}
                  onChange={(e) => setCopDiscWithout(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputBase}
                  placeholder="0"
                />
              </label>
              <label className={labelBase}>
                <span className="font-medium">Precio final en COP</span>
                <input type="number" disabled value={copFinalWithout} className={inputBase} />
              </label>
            </div>
          </>
        )}
      </div>

      {/* “Desde” (opcionales) */}
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
