"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NuevoDestinoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        name: String(formData.get("name") || "").trim(),
        country: String(formData.get("country") || "").trim(),
        city: String(formData.get("city") || "").trim() || undefined,
        category: String(formData.get("category") || "").trim() || undefined,
        description: String(formData.get("description") || "").trim() || undefined,
        isActive: (formData.get("isActive") as FormDataEntryValue) === "on",
      };

      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "No se pudo crear el destino");
        setLoading(false);
        return;
      }

      router.replace("/dashboard-seller/destinos");
    } catch (e) {
      setErrorMsg("Error de red");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Nuevo destino</h1>
        <p className="text-sm text-gray-500">Crea un destino para tu empresa.</p>
      </header>

      <form action={onSubmit} className="rounded-xl border bg-white p-4 grid gap-3 max-w-2xl">
        {errorMsg && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</div>}

        <div className="grid gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <input name="name" required className="rounded-md border px-3 py-2 text-sm" placeholder="Ej. Cartagena" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">País *</label>
            <input name="country" required className="rounded-md border px-3 py-2 text-sm" placeholder="Ej. CO" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Ciudad</label>
            <input name="city" className="rounded-md border px-3 py-2 text-sm" placeholder="Ej. Cartagena" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Categoría</label>
            <input name="category" className="rounded-md border px-3 py-2 text-sm" placeholder="Playa, Ciudad, Montaña..." />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Activo</label>
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Descripción</label>
          <textarea name="description" rows={4} className="rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar destino"}
          </button>
          <a href="/dashboard-seller/destinos" className="rounded-md border px-4 py-2 text-sm">
            Cancelar
          </a>
        </div>

        <p className="text-xs text-gray-500">
          * Recuerda: la combinación <b>Nombre + País + Ciudad</b> debe ser única en tu empresa.
        </p>
      </form>
    </div>
  );
}
