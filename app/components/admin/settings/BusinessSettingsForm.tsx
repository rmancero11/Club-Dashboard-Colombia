"use client";

import { useMemo, useState } from "react";
import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";

countries.registerLocale(es);

type Biz = {
  id: string;
  Name: string;
  slug: string;
  country: string | null;       // Puede ser "Colombia" o "CO"
  Template: string | null;
  IconoWhite: string | null;
  Cover: string | null;
};

export default function BusinessSettingsForm({ business }: { business: Biz }) {
  // ----- Lista de países (ES) ordenada -----
  const countryOptions = useMemo(() => {
    const entries = Object.entries(
      countries.getNames("es", { select: "official" })
    ) as Array<[string, string]>; // [ISO2, Nombre]
    // [{ code:'CO', label:'Colombia' }, ...]
    return entries
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, []);

  // ----- Resolver el valor actual de la BD a un label de la lista -----
  const { resolvedCountryLabel, needsExtraOption } = useMemo(() => {
    const dbRaw = (business.country || "").trim();
    if (!dbRaw) return { resolvedCountryLabel: "", needsExtraOption: false };

    // Caso 1: parece un ISO alpha-2 (2 letras)
    if (/^[A-Za-z]{2}$/.test(dbRaw)) {
      const label = countries.getName(dbRaw.toUpperCase(), "es");
      if (label) return { resolvedCountryLabel: label, needsExtraOption: false };
      // si no existe ese código, caemos a comparar por nombre
    }

    // Caso 2: comparar por nombre (case-insensitive) con las opciones oficiales
    const lower = dbRaw.toLocaleLowerCase("es");
    const match = countryOptions.find(
      (o) => o.label.toLocaleLowerCase("es") === lower
    );
    if (match) return { resolvedCountryLabel: match.label, needsExtraOption: false };

    // Caso 3: nombre no oficial/no estándar → mostramos una opción extra para que el select lo muestre
    return { resolvedCountryLabel: dbRaw, needsExtraOption: true };
  }, [business.country, countryOptions]);

  // ----- Estado del formulario -----
  const [state, setState] = useState({
    Name: business.Name,
    country: resolvedCountryLabel, // siempre un label (o el valor crudo de BD)
    Template: business.Template || "",
  });

  // Previews y archivos
  const [iconPreview, setIconPreview] = useState<string | null>(business.IconoWhite);
  const [coverPreview, setCoverPreview] = useState<string | null>(business.Cover);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Opciones para pintar en el <select> (si hace falta, agregamos la opción "extra" con el valor de BD)
  const renderOptions = useMemo(() => {
    if (!needsExtraOption || !state.country) return countryOptions;
    // Insertamos una opción al inicio con el valor exacto de BD para que quede seleccionado visualmente.
    // Evitamos duplicados si coincide con alguna etiqueta oficial.
    const alreadyExists = countryOptions.some(
      (o) => o.label.toLocaleLowerCase("es") === state.country.toLocaleLowerCase("es")
    );
    if (alreadyExists) return countryOptions;
    return [{ code: "__DB__", label: state.country }, ...countryOptions];
  }, [needsExtraOption, state.country, countryOptions]);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
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
      // Guardamos el **nombre** del país (coherente con tu schema actual)
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
          <select
            name="country"
            value={state.country}
            onChange={onChange}
            className="rounded-md border px-3 py-2"
          >
            <option value="">Selecciona un país</option>
            {renderOptions.map((o) => (
              // Guardamos el NOMBRE para no tocar backend; si luego quieres ISO: value={o.code}
              <option key={o.code} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
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
