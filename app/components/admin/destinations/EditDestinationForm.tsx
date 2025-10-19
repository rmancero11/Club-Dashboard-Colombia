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
  const [name, setName] = useState(dest.name);
  const [country, setCountry] = useState(dest.country);
  const [city, setCity] = useState(dest.city || "");
  const [category, setCategory] = useState(dest.category || "");
  const [description, setDescription] = useState(dest.description || "");
  const [price, setPrice] = useState(dest.price?.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(dest.discountPrice?.toString() || "");

  // Imagen actual y nueva vista previa
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage] = useState(dest.imageUrl || ""); // solo lectura para mostrar la actual
  const [newPreview, setNewPreview] = useState<string>(""); // preview de la imagen seleccionada

  const [saving, setSaving] = useState(false);

  // Generar vista previa de la nueva imagen seleccionada (sin tocar la actual)
  useEffect(() => {
    if (!imageFile) {
      setNewPreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setNewPreview((e.target?.result as string) || "");
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("country", country.trim());
      formData.append("city", city.trim() || "");
      formData.append("category", category.trim() || "");
      formData.append("description", description.trim() || "");
      formData.append("price", price.trim());
      formData.append("discountPrice", discountPrice.trim() || "");
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`/api/admin/destinations/${dest.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo actualizar el destino");
        return;
      }

      location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
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

      {/* Selector de nueva imagen */}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Cambiar imagen</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="rounded-md border px-3 py-2"
        />
        <span className="text-xs text-gray-500">
          Selecciona un archivo para previsualizarlo antes de guardar.
        </span>
      </label>

      {/* Vista previa de la nueva imagen */}
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

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Nombre *</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">País *</span>
          <input
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Ciudad</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Categoría</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Descripción</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>
      </div>

      {/* Campos: price y discountPrice */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Precio *</span>
          <input
            required
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Precio con descuento</span>
          <input
            type="number"
            step="0.01"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
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
