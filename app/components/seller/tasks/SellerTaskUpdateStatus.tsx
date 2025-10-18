"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
  CANCELLED: "Cancelada",
};

export default function SellerTaskUpdateStatus({
  id,
  status,
}: {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as typeof status;
    setLoading(true);
    const res = await fetch(`/api/seller/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo actualizar el estado.");
      setValue(status);
      return;
    }
    setValue(next);
    router.refresh();
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
        {Object.keys(STATUS_LABEL).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
