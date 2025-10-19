"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDestinationPage() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  // Generar/limpiar URL de previsualización
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("country", country.trim());
      if (city) formData.append("city", city.trim());
      if (category) formData.append("category", category.trim());
      if (description) formData.append("description", description.trim());
      if (price !== "") formData.append("price", String(price));
      if (discountPrice !== "") formData.append("discountPrice", String(discountPrice));
      if (image) formData.append("image", image);

      const res = await fetch("/api/admin/destinations", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.error || "No se pudo crear");
      } else {
        setMsg("Destino creado.");
        router.replace(`/dashboard-admin/destinos/${data.destination.id}`);
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

      <form
        onSubmit={onSubmit}
        className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm grid gap-4"
      >
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

        {/* Categoría y Descripción */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className="font-medium">Categoría</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
              placeholder="Playa, Aventura..."
            />
          </label>
          <label className={labelClass}>
            <span className="font-medium">Descripción</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Un paraíso tropical..."
            />
          </label>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className="font-medium">Precio *</span>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputClass}
              placeholder="1000"
              min="0"
              step="0.01"
            />
          </label>
          <label className={labelClass}>
            <span className="font-medium">Precio con descuento</span>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputClass}
              placeholder="900"
              min="0"
              step="0.01"
            />
          </label>
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
