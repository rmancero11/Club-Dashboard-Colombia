"use client";

import { useState } from "react";

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
          country: newB.country.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "No se pudo crear");
      setBranches([{ ...data.branch, createdAt: new Date().toISOString() }, ...branches]);
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

  async function delBranch(id: string) {
    if (!confirm("¿Eliminar sucursal?")) return;
    const res = await fetch(`/api/admin/branches/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "No se pudo eliminar (¿tiene relaciones?)");
      return;
    }
    setBranches((all) => all.filter((b) => b.id !== id));
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={createBranch} className="grid gap-3 sm:grid-cols-5">
        <input required placeholder="Nombre *" className="rounded-md border px-3 py-2 text-sm sm:col-span-1"
          value={newB.name} onChange={(e)=>setNewB({...newB, name: e.target.value})} />
        <input placeholder="Dirección" className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          value={newB.address} onChange={(e)=>setNewB({...newB, address: e.target.value})} />
        <input placeholder="Maps URL" className="rounded-md border px-3 py-2 text-sm sm:col-span-1"
          value={newB.mapsUrl} onChange={(e)=>setNewB({...newB, mapsUrl: e.target.value})} />
        <div className="flex gap-2 sm:col-span-1">
          <input placeholder="País" className="w-full rounded-md border px-3 py-2 text-sm"
            value={newB.country} onChange={(e)=>setNewB({...newB, country: e.target.value})} />
          <button disabled={creating} className="rounded-md border px-3 py-2 text-sm">{creating ? "Creando..." : "Añadir"}</button>
        </div>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Nombre</th>
              <th className="px-2 py-2">Dirección</th>
              <th className="px-2 py-2">Maps</th>
              <th className="px-2 py-2">País</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && <tr><td colSpan={5} className="px-2 py-8 text-center text-gray-400">Sin sucursales</td></tr>}
            {branches.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-2 py-2">
                  <input defaultValue={b.name} className="w-full rounded-md border px-2 py-1"
                    onBlur={(e)=> saveBranch(b.id, { name: e.target.value })} />
                </td>
                <td className="px-2 py-2">
                  <input defaultValue={b.address || ""} className="w-full rounded-md border px-2 py-1"
                    onBlur={(e)=> saveBranch(b.id, { address: e.target.value || null })} />
                </td>
                <td className="px-2 py-2">
                  <input defaultValue={b.mapsUrl || ""} className="w-full rounded-md border px-2 py-1"
                    onBlur={(e)=> saveBranch(b.id, { mapsUrl: e.target.value || null })} />
                </td>
                <td className="px-2 py-2">
                  <input defaultValue={b.country || ""} className="w-full rounded-md border px-2 py-1"
                    onBlur={(e)=> saveBranch(b.id, { country: e.target.value || null })} />
                </td>
                <td className="px-2 py-2 text-right">
                  <button onClick={()=>delBranch(b.id)} className="text-red-600 underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
