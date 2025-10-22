"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABEL = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
  CANCELLED: "Cancelada",
} as const;

const STATUSES = Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>;
type Status = keyof typeof STATUS_LABEL;

export default function SellerTaskUpdateStatus({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Status;
    if (next === value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "No se pudo actualizar el estado.");
        // revertir selección visual
        e.target.value = value;
        return;
      }
      setValue(next);
      router.refresh();
    } catch {
      alert("Hubo un error de red al actualizar el estado.");
      e.target.value = value;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm text-gray-600">Cambiar estado:</label>
      <select
        className="rounded-md border px-2 py-1 text-sm"
        value={value}
        onChange={onChange}
        disabled={loading}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
