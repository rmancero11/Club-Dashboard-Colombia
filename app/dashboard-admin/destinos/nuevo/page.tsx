"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuevo destino</h1>
        <a href="/dashboard-admin/destinos" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border bg-white p-4 grid gap-3 max-w-xl"
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
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nombre *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border px-3 py-2"
            placeholder="Cancún"
          />
        </label>

        {/* País / Ciudad */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">País *</span>
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-md border px-3 py-2"
              placeholder="México"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Ciudad</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border px-3 py-2"
              placeholder="Quintana Roo"
            />
          </label>
        </div>

        {/* Categoría y Descripción */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Categoría</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border px-3 py-2"
              placeholder="Playa, Aventura..."
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Descripción</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border px-3 py-2"
              placeholder="Un paraíso tropical..."
            />
          </label>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Precio *</span>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-md border px-3 py-2"
              placeholder="1000"
              min="0"
              step="0.01"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Precio con descuento</span>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-md border px-3 py-2"
              placeholder="900"
              min="0"
              step="0.01"
            />
          </label>
        </div>

        {/* Imagen */}
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Imagen</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear destino"}
          </button>
          <a
            href="/dashboard-admin/destinos"
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
