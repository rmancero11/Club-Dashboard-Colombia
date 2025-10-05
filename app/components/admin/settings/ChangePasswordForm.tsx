"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!next || next.length < 6) return alert("La nueva contraseña debe tener al menos 6 caracteres.");
    if (next !== confirm) return alert("Las contraseñas no coinciden.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data?.error || "No se pudo cambiar la contraseña");
      alert("Contraseña actualizada");
      setCurrent(""); setNext(""); setConfirm("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Contraseña actual</span>
        <input type="password" value={current} onChange={(e)=>setCurrent(e.target.value)} className="rounded-md border px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Nueva contraseña</span>
        <input type="password" value={next} onChange={(e)=>setNext(e.target.value)} className="rounded-md border px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Confirmar nueva</span>
        <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="rounded-md border px-3 py-2" />
      </label>
      <div className="pt-2">
        <button type="submit" disabled={saving} className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {saving ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}
