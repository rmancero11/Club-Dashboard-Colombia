"use client";

import { useState, useEffect } from "react";

type Dest = {
  id: string;
  name: string;
  country: string;
  city: string | null;
  category: string | null;
  description: string | null;
  imageUrl?: string | null;
  price: string | number;
  discountPrice: string | number | null;
};

export default function EditDestinationForm({ dest }: { dest: Dest }) {
  // Estado editable
  const [name, setName] = useState(dest.name);
  const [country, setCountry] = useState(dest.country);
  const [city, setCity] = useState(dest.city || "");
  const [category, setCategory] = useState(dest.category || "");
  const [description, setDescription] = useState(dest.description || "");
  const [price, setPrice] = useState(dest.price?.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(
    dest.discountPrice?.toString() || ""
  );

  // Imagen actual y nueva
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage] = useState(dest.imageUrl || "");
  const [newPreview, setNewPreview] = useState<string>("");

  // UI
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vista previa de imagen nueva
  useEffect(() => {
    if (!imageFile) {
      setNewPreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setNewPreview((e.target?.result as string) || "");
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const trimOrEmpty = (v: string) => v.trim();
  const sameStr = (a?: string | null, b?: string | null) =>
    (a ?? "") === (b ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const fd = new FormData();
      // Flag para evitar iterar el FormData (evita el error TS)
      let hasChanges = false;

      // Helper: setea en FormData y marca cambios
      const setChange = (key: string, val: string) => {
        fd.set(key, val);
        hasChanges = true;
      };

      // Comparar y enviar SOLO si cambió
      if (!sameStr(dest.name, name)) setChange("name", trimOrEmpty(name));
      if (!sameStr(dest.country, country)) setChange("country", trimOrEmpty(country));

      // city/category/description: si las dejas vacías y antes había valor, se enviará "" (backend las pondrá en null)
      if (!sameStr(dest.city, city)) setChange("city", trimOrEmpty(city));
      if (!sameStr(dest.category, category)) setChange("category", trimOrEmpty(category));
      if (!sameStr(dest.description, description)) setChange("description", trimOrEmpty(description));

      // price (requerido): compara y envía si cambió
      const initialPrice = dest.price?.toString() ?? "";
      if (price.trim() !== initialPrice) setChange("price", price.trim());

      // discountPrice:
      // - Si antes tenía valor y ahora está vacío -> enviar "" para limpiar (backend => null)
      // - Si cambió a otro valor -> actualizar
      const initialDiscount = dest.discountPrice?.toString() ?? "";
      if (discountPrice.trim() !== initialDiscount) {
        setChange("discountPrice", discountPrice.trim());
      }

      // Imagen nueva (clave: "image")
      if (imageFile) {
        fd.set("image", imageFile);
        hasChanges = true;
      }

      // Si no hay cambios, no llamamos al API
      if (!hasChanges) {
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/destinations/${dest.id}`, {
        method: "PATCH",
        body: fd, // Importante: NO pongas Content-Type manualmente
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error || "No se pudo actualizar el destino");
        return;
      }

      // Recarga para ver cambios
      location.reload();
    } catch {
      setErrorMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  const inputBase = "rounded-md border px-3 py-2";
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
          <p className="mb-2 text-sm font-medium text-gray-700">
            Vista previa de la nueva imagen
          </p>
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
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputBase}
        />
      </label>

      {/* País / Ciudad */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">País *</span>
          <input
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputBase}
          />
        </label>

        <label className={labelBase}>
          <span className="font-medium">Ciudad</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputBase}
          />
        </label>
      </div>

      {/* Categoría / Descripción */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">Categoría</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputBase}
          />
        </label>

        <label className={labelBase}>
          <span className="font-medium">Descripción</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputBase}
          />
        </label>
      </div>

      {/* Precio / Descuento */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelBase}>
          <span className="font-medium">Precio *</span>
          <input
            required
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputBase}
          />
        </label>

        <label className={labelBase}>
          <span className="font-medium">Precio con descuento</span>
          <input
            type="number"
            step="0.01"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className={inputBase}
          />
          <span className="text-xs text-gray-500">
            Déjalo vacío para mantener; si antes tenía valor y lo dejas vacío, se limpiará.
          </span>
        </label>
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
