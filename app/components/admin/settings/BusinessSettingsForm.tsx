"use client";

import { useState } from "react";

type Biz = {
  id: string;
  Name: string;
  slug: string;
  country: string | null;
  Plan: string | null;
  Template: string | null;
  BusinessProgram: string | null;
  PricePlan: number | null;
  IconoWhite: string | null;
  Cover: string | null;
  SocialMedia: any | null;
};

export default function BusinessSettingsForm({ business }: { business: Biz }) {
  const [state, setState] = useState({
    Name: business.Name,
    country: business.country || "",
    Plan: business.Plan || "",
    Template: business.Template || "",
    BusinessProgram: business.BusinessProgram || "",
    PricePlan: business.PricePlan?.toString() || "",
    IconoWhite: business.IconoWhite || "",
    Cover: business.Cover || "",
    SocialMedia: JSON.stringify(business.SocialMedia ?? {}, null, 2),
  });
  const [saving, setSaving] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let social: any = null;
      try {
        social = state.SocialMedia ? JSON.parse(state.SocialMedia) : null;
      } catch {
        alert("SocialMedia debe ser JSON válido");
        return;
      }
      const res = await fetch("/api/admin/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          Name: state.Name.trim(),
          country: state.country.trim() || null,
          Plan: state.Plan.trim() || null,
          Template: state.Template.trim() || null,
          BusinessProgram: state.BusinessProgram.trim() || null,
          PricePlan: state.PricePlan ? Number(state.PricePlan) : null,
          IconoWhite: state.IconoWhite.trim() || null,
          Cover: state.Cover.trim() || null,
          SocialMedia: social,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "No se pudo guardar");
        return;
      }
      alert("Guardado");
      location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-3xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nombre *</span>
          <input name="Name" value={state.Name} onChange={onChange} required className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">País</span>
          <input name="country" value={state.country} onChange={onChange} className="rounded-md border px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Plan</span>
          <input name="Plan" value={state.Plan} onChange={onChange} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Template</span>
          <input name="Template" value={state.Template} onChange={onChange} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Programa</span>
          <input name="BusinessProgram" value={state.BusinessProgram} onChange={onChange} className="rounded-md border px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Price Plan</span>
          <input name="PricePlan" value={state.PricePlan} onChange={onChange} type="number" className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Logo (IconoWhite)</span>
          <input name="IconoWhite" value={state.IconoWhite} onChange={onChange} className="rounded-md border px-3 py-2" placeholder="URL" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Cover</span>
          <input name="Cover" value={state.Cover} onChange={onChange} className="rounded-md border px-3 py-2" placeholder="URL" />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">SocialMedia (JSON)</span>
        <textarea name="SocialMedia" rows={6} value={state.SocialMedia} onChange={onChange} className="rounded-md border px-3 py-2 font-mono" />
      </label>

      <div className="pt-2">
        <button type="submit" disabled={saving} className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
