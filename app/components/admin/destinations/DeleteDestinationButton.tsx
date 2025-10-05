"use client";

import { useState } from "react";

export default function DeleteDestinationButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;
    if (!confirm("¿Eliminar destino? Esta acción es permanente.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/destinations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo eliminar el destino.");
        return;
      }
      location.href = "/dashboard-admin/destinos";
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border px-4 py-2 text-sm text-red-600 disabled:opacity-50"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
