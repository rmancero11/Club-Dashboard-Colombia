"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteSellerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tempPass, setTempPass] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErrorMsg(null); setTempPass(null);
    try {
      const res = await fetch("/api/admin/users/invite-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim(),
          commissionRate: Number(commissionRate),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "No se pudo invitar");
      } else {
        setTempPass(data.tempPassword);
      }
    } catch {
      setErrorMsg("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invitar vendedor</h1>
          <p className="text-sm text-gray-500">Crea una cuenta SELLER con contraseña temporal.</p>
        </div>
        <a href="/dashboard-admin/usuarios" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
      </header>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 grid gap-3 max-w-md">
        {errorMsg && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</div>}
        {tempPass && (
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <div><b>Usuario creado.</b> Contraseña temporal:</div>
            <code className="text-sm">{tempPass}</code>
            <div className="text-xs text-gray-600 mt-1">Compártela al vendedor y sugiérele cambiarla al ingresar.</div>
          </div>
        )}

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            className="rounded-md border px-3 py-2"
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del vendedor"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Email *</span>
          <input
            required type="email"
            className="rounded-md border px-3 py-2"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">% Comisión (0–100)</span>
          <input
            type="number" min={0} max={100} step="0.01"
            className="rounded-md border px-3 py-2"
            value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)}
            placeholder="10"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Creando..." : "Invitar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard-admin/usuarios")}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
