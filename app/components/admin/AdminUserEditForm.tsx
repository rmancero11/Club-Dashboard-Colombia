"use client";

import { useState } from "react";

type Role = "ADMIN" | "SELLER" | "USER";
type Status = "ACTIVE" | "INACTIVE";

export default function AdminUserEditForm(props: {
  user: { id: string; role: Role; status: Status; commissionRate: number | null };
}) {
  const [role, setRole] = useState<Role>(props.user.role);
  const [status, setStatus] = useState<Status>(props.user.status);
  const [commissionRate, setCommissionRate] = useState<string>(
    props.user.commissionRate != null ? String(props.user.commissionRate) : ""
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null); setErr(null);
    try {
      const payload: any = { role, status };
      if (role === "SELLER") {
        const num = Number(commissionRate);
        if (Number.isNaN(num) || num < 0 || num > 100) {
          setErr("La comisión debe estar entre 0 y 100.");
          setLoading(false);
          return;
        }
        payload.commissionRate = num;
      }
      const res = await fetch(`/api/admin/users/${props.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "No se pudo actualizar");
      } else {
        setMsg("Usuario actualizado correctamente.");
      }
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md">
      {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Rol</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-md border px-3 py-2"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="SELLER">SELLER</option>
          <option value="USER">USER</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Estado</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="rounded-md border px-3 py-2"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </label>

      {role === "SELLER" && (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">% Comisión (0–100)</span>
          <input
            type="number" min={0} max={100} step="0.01"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            className="rounded-md border px-3 py-2"
            placeholder="Ej. 10"
          />
        </label>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <a href="/dashboard-admin/usuarios" className="rounded-md border px-4 py-2 text-sm">Cancelar</a>
      </div>
    </form>
  );
}
