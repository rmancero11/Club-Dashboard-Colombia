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

  // ====== Categorías (tags por coma)
  const initialCategoriesStr = useMemo(
    () => (dest.categories || []).map((c) => c.name).join(", "),
    [dest.categories]
  );
  const [categoriesInput, setCategoriesInput] = useState(initialCategoriesStr);
  const categories = useMemo(
    () =>
      categoriesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [categoriesInput]
  );

  // ====== Precios
  const [priceUSDWithAirfare, setPriceUSDWithAirfare] = useState<UINumber>(dest.priceUSDWithAirfare ?? "");
  const [priceUSDWithoutAirfare, setPriceUSDWithoutAirfare] = useState<UINumber>(dest.priceUSDWithoutAirfare ?? "");
  const [priceCOPWithAirfare, setPriceCOPWithAirfare] = useState<UINumber>(dest.priceCOPWithAirfare ?? "");
  const [priceCOPWithoutAirfare, setPriceCOPWithoutAirfare] = useState<UINumber>(dest.priceCOPWithoutAirfare ?? "");
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

  // ====== Comparadores de cambios
  const categoriesEqual = useMemo(() => {
    const a = (dest.categories || []).map((c) => c.name.trim().toLowerCase()).sort();
    const b = categories.map((c) => c.trim().toLowerCase()).sort();
    return JSON.stringify(a) === JSON.stringify(b);
  }, [dest.categories, categories]);

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

      // Categorías
      if (!categoriesEqual) setChange("categories", JSON.stringify(categories));

      // Precios
      if (!sameNumStr(dest.priceUSDWithAirfare, priceUSDWithAirfare))
        setChange("priceUSDWithAirfare", toNumStr(priceUSDWithAirfare));
      if (!sameNumStr(dest.priceUSDWithoutAirfare, priceUSDWithoutAirfare))
        setChange("priceUSDWithoutAirfare", toNumStr(priceUSDWithoutAirfare));
      if (!sameNumStr(dest.priceCOPWithAirfare, priceCOPWithAirfare))
        setChange("priceCOPWithAirfare", toNumStr(priceCOPWithAirfare));
      if (!sameNumStr(dest.priceCOPWithoutAirfare, priceCOPWithoutAirfare))
        setChange("priceCOPWithoutAirfare", toNumStr(priceCOPWithoutAirfare));

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
        body: fd, // no seteas Content-Type aquí
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error || "No se pudo actualizar el destino");
        return;
      }

      // Refresca para ver cambios
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

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      {errorMsg && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Imagen actual */}
      {currentImage && (
        <div className="mb-2">
          <p className="mb-2 text-sm font-medium text-gray-700">Imagen actual</p>
          <img
            src={currentImage}
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

      {/* Categorías */}
      <label className={labelBase}>
        <span className="font-medium">Categorías</span>
        <input
          value={categoriesInput}
          onChange={(e) => setCategoriesInput(e.target.value)}
          className={inputBase}
          placeholder="Playa, Aventura, Cultura"
        />
        <span className="text-xs text-gray-500">Separa con coma. Ej.: Playa, Aventura</span>
      </label>

      {/* Precios USD */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">USD (con aéreo) *</span>
          <input
            type="number"
            step="0.01"
            value={priceUSDWithAirfare}
            onChange={(e) => setPriceUSDWithAirfare(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputBase}
            placeholder="1499"
          />
        </label>
        <label className={labelBase}>
          <span className="font-medium">USD (sin aéreo) *</span>
          <input
            type="number"
            step="0.01"
            value={priceUSDWithoutAirfare}
            onChange={(e) => setPriceUSDWithoutAirfare(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputBase}
            placeholder="999"
          />
        </label>
      </div>

      {/* Precios COP */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">COP (con aéreo) *</span>
          <input
            type="number"
            step="1"
            value={priceCOPWithAirfare}
            onChange={(e) => setPriceCOPWithAirfare(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputBase}
            placeholder="5800000"
          />
        </label>
        <label className={labelBase}>
          <span className="font-medium">COP (sin aéreo) *</span>
          <input
            type="number"
            step="1"
            value={priceCOPWithoutAirfare}
            onChange={(e) => setPriceCOPWithoutAirfare(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputBase}
            placeholder="3900000"
          />
        </label>
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
