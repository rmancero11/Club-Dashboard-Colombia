"use client";

import { useState } from "react";

type Biz = {
  id: string;
  Name: string;
  slug: string;
  country: string | null;
  Template: string | null;
  IconoWhite: string | null;
  Cover: string | null;
};

export default function BusinessSettingsForm({ business }: { business: Biz }) {
  const [state, setState] = useState({
    Name: business.Name,
    country: business.country || "",
    Template: business.Template || "",
  });

  const [iconPreview, setIconPreview] = useState<string | null>(business.IconoWhite);
  const [coverPreview, setCoverPreview] = useState<string | null>(business.Cover);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
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
      const fd = new FormData();
      fd.append("Name", state.Name.trim());
      fd.append("country", state.country.trim());
      fd.append("Template", state.Template.trim());

      if (iconFile) fd.append("IconoWhite", iconFile);
      if (coverFile) fd.append("Cover", coverFile);

      const res = await fetch("/api/admin/business/logo-cover", {
        method: "PUT",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "❌ No se pudo guardar los cambios");
        return;
      }

      alert("✅ Cambios guardados correctamente");
      if (data?.business?.IconoWhite) setIconPreview(data.business.IconoWhite);
      if (data?.business?.Cover) setCoverPreview(data.business.Cover);
      setIconFile(null);
      setCoverFile(null);
    } catch (err) {
      console.error(err);
      alert("Error al enviar los datos");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="grid gap-4 max-w-3xl"
    >
      {/* Datos principales */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nombre *</span>
          <input
            name="Name"
            value={state.Name}
            onChange={onChange}
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">País</span>
          <input
            name="country"
            value={state.country}
            onChange={onChange}
            className="rounded-md border px-3 py-2"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Template</span>
        <input
          name="Template"
          value={state.Template}
          onChange={onChange}
          className="rounded-md border px-3 py-2"
        />
      </label>

      {/* Archivos: Logo & Cover */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Logo */}
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Logo (IconoWhite)</span>
            <input
              type="file"
              name="IconoWhite"
              accept="image/*"
              className="rounded-md border px-2 py-1"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIconFile(file);
                  setIconPreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
          <div className="border rounded-md p-2 bg-gray-50">
            {iconPreview ? (
              <img
                src={iconPreview}
                alt="Preview logo"
                className="h-24 w-auto object-contain mx-auto"
              />
            ) : (
              <div className="text-xs text-gray-500 text-center py-6">
                Sin logo cargado
              </div>
            )}
          </div>
        </div>

        {/* Cover */}
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Cover</span>
            <input
              type="file"
              name="Cover"
              accept="image/*"
              className="rounded-md border px-2 py-1"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCoverFile(file);
                  setCoverPreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
          <div className="border rounded-md p-2 bg-gray-50">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Preview cover"
                className="h-32 w-full object-cover rounded"
              />
            ) : (
              <div className="text-xs text-gray-500 text-center py-6">
                Sin cover cargado
              </div>
            )}
          </div>
        </div>
      </div>

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
