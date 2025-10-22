"use client";

import { useState } from "react";

export default function AccountSettingsForm({
  me,
}: {
  me: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    timezone: string | null;
  };
}) {
  const [name, setName] = useState(me.name || "");
  const [phone, setPhone] = useState(me.phone || "");
  const [timezone, setTimezone] = useState(me.timezone || "America/Bogota");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: me.id,
          name: name.trim() || null,
          phone: phone.trim() || null,
          timezone: timezone || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo guardar");
        return;
      }

      alert("Cambios guardados correctamente.");
      location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      <div className="text-sm text-gray-500">Correo: {me.email}</div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Teléfono</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Zona horaria</span>
        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="rounded-md border px-3 py-2"
          placeholder="America/Bogota"
        />
      </label>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
