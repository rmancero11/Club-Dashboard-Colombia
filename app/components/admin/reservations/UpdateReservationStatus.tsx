"use client";

import { useState } from "react";

type Status = "DRAFT" | "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";

export default function UpdateReservationStatus({ id, status }: { id: string; status: Status }) {
  const [value, setValue] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  async function update(newStatus: Status) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo cambiar el estado");
        return;
      }
      setValue(newStatus);
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  const buttons: Status[] = ["DRAFT", "PENDING", "CONFIRMED", "CANCELED", "COMPLETED"];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map(s => (
        <button
          key={s}
          onClick={() => update(s)}
          disabled={loading}
          className={`rounded-md border px-3 py-1 text-sm ${value === s ? "bg-black text-white" : ""}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
