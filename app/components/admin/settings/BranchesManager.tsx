"use client";

import { useMemo, useState } from "react";
import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";

countries.registerLocale(es);

type Branch = {
  id: string;
  name: string;
  address: string | null;
  mapsUrl: string | null;
  country: string | null;
  createdAt: string;
};

export default function BranchesManager({ initialBranches }: { initialBranches: Branch[] }) {
  const [branches, setBranches] = useState(initialBranches);
  const [creating, setCreating] = useState(false);
  const [newB, setNewB] = useState({ name: "", address: "", mapsUrl: "", country: "" });

  // Estado local para edición del país por fila
  const [countryEdits, setCountryEdits] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const b of initialBranches) map[b.id] = b.country || "";
    return map;
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  const countryOptions = useMemo(() => {
    const entries = Object.entries(
      countries.getNames("es", { select: "official" })
    ) as Array<[string, string]>; // [ISO2, Nombre]
    return entries
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, []);

  async function createBranch(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newB.name.trim(),
          address: newB.address.trim() || null,
          mapsUrl: newB.mapsUrl.trim() || null,
          country: newB.country.trim() || null, // guardamos NOMBRE del país
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "No se pudo crear");
      const created: Branch = { ...data.branch, createdAt: new Date().toISOString() };
      setBranches((prev) => [created, ...prev]);
      setCountryEdits((prev) => ({ ...prev, [created.id]: created.country || "" }));
      setNewB({ name: "", address: "", mapsUrl: "", country: "" });
    } finally {
      setCreating(false);
    }
  }

  async function saveBranch(id: string, patch: Partial<Branch>) {
    const res = await fetch(`/api/admin/branches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || "No se pudo actualizar");
      return false;
    }
    setBranches((all) => all.map((b) => (b.id === id ? { ...b, ...patch } as Branch : b)));
    return true;
  }

  async function saveCountry(id: string) {
    if (savingId) return;
    const current = branches.find((b) => b.id === id);
    const edited = countryEdits[id] ?? "";
    if (!current) return;
    // Si no cambió, no hacemos request
    if ((current.country || "") === (edited || "")) return;

    setSavingId(id);
    const ok = await saveBranch(id, { country: edited || null });
    if (!ok) {
      // si falla, no actualizamos el estado local (el usuario ve el valor editado aún)
      setSavingId(null);
      return;
    }
    setSavingId(null);
  }

  function cancelCountryEdit(id: string) {
    const current = branches.find((b) => b.id === id);
    setCountryEdits((prev) => ({ ...prev, [id]: current?.country || "" }));
  }

  async function delBranch(id: string) {
    if (!confirm("¿Eliminar sucursal?")) return;
    const res = await fetch(`/api/admin/branches/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "No se pudo eliminar (¿tiene relaciones?)");
      return;
    }
    setBranches((all) => all.filter((b) => b.id !== id));
    setCountryEdits((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  return (
    <div className="grid gap-4">
      {/* Crear sucursal */}
      <form onSubmit={createBranch} className="grid gap-3 sm:grid-cols-5">
        <input
          required
          placeholder="Nombre *"
          className="rounded-md border px-3 py-2 text-sm sm:col-span-1"
          value={newB.name}
          onChange={(e) => setNewB({ ...newB, name: e.target.value })}
        />
        <input
          placeholder="Dirección"
          className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          value={newB.address}
          onChange={(e) => setNewB({ ...newB, address: e.target.value })}
        />
        <input
          placeholder="Maps URL"
          className="rounded-md border px-3 py-2 text-sm sm:col-span-1"
          value={newB.mapsUrl}
          onChange={(e) => setNewB({ ...newB, mapsUrl: e.target.value })}
        />
        <div className="flex gap-2 sm:col-span-1">
          {/* Select de País (crear) */}
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={newB.country}
            onChange={(e) => setNewB({ ...newB, country: e.target.value })}
          >
            <option value="">País</option>
            {countryOptions.map((o) => (
              <option key={o.code} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
          <button disabled={creating} className="rounded-md border px-3 py-2 text-sm">
            {creating ? "Creando..." : "Añadir"}
          </button>
        </div>
      </form>

      {/* Listado/edición */}
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Nombre</th>
              <th className="px-2 py-2">Dirección</th>
              <th className="px-2 py-2">Maps</th>
              <th className="px-2 py-2">País</th>
              <th className="px-2 py-2 w-40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-8 text-center text-gray-400">
                  Sin sucursales
                </td>
              </tr>
            )}
            {branches.map((b) => {
              const editedValue = countryEdits[b.id] ?? "";
              const changed = (b.country || "") !== (editedValue || "");
              const isSaving = savingId === b.id;
              return (
                <tr key={b.id} className="border-t">
                  <td className="px-2 py-2">
                    <input
                      defaultValue={b.name}
                      className="w-full rounded-md border px-2 py-1"
                      onBlur={(e) => saveBranch(b.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      defaultValue={b.address || ""}
                      className="w-full rounded-md border px-2 py-1"
                      onBlur={(e) => saveBranch(b.id, { address: e.target.value || null })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      defaultValue={b.mapsUrl || ""}
                      className="w-full rounded-md border px-2 py-1"
                      onBlur={(e) => saveBranch(b.id, { mapsUrl: e.target.value || null })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {/* Select controlado + botones de acción */}
                    <div className="flex items-center gap-2">
                      <select
                        value={editedValue}
                        className="w-full rounded-md border px-2 py-1"
                        onChange={(e) =>
                          setCountryEdits((prev) => ({ ...prev, [b.id]: e.target.value }))
                        }
                      >
                        <option value="">Selecciona un país</option>
                        {countryOptions.map((o) => (
                          <option key={o.code} value={o.label}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => delBranch(b.id)}
                        className="text-red-600 underline"
                        type="button"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => cancelCountryEdit(b.id)}
                        className={`rounded-md border px-3 py-1 text-sm ${changed ? "" : "opacity-50 pointer-events-none"}`}
                        type="button"
                        title="Revertir cambios de país"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveCountry(b.id)}
                        className={`rounded-md border px-3 py-1 text-sm ${changed ? "bg-black text-white" : "opacity-50 pointer-events-none"}`}
                        disabled={!changed || isSaving}
                        type="button"
                      >
                        {isSaving ? "Guardando..." : "Guardar país"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
