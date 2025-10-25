"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/hooks/useToast";
import { useMemo, useState } from "react";
import Select, { GroupBase } from "react-select";
import countryList from "react-select-country-list";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

type Seller = { id: string; name: string | null; email: string };

// Opción tipada para react-select (país)
type CountryOption = { label: string; value: string }; // value = ISO alpha-2

type FormValues = {
  sellerId: string;

  // USER (se usa también para poblar Client sin duplicar inputs)
  email: string;
  password: string;
  name?: string;
  phone?: string;       // E.164 del PhoneInput
  countryIso?: string;  // ISO alpha-2 seleccionado en el Select

  // CLIENT extra (sin duplicar email/phone/country)
  documentId?: string;
  city?: string;
  birthDate?: string; // yyyy-mm-dd
  tags?: string;      // coma-separado
  notes?: string;
  isArchived?: boolean;
};

export default function CreateClientForm({ sellers }: { sellers: Seller[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Genera la lista de países [{label, value}] tipada
  const options = useMemo<CountryOption[]>(
    () => countryList().getData().map(({ label, value }) => ({ label, value })),
    []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { isArchived: false },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      // Derivar nombre de país legible por ISO para User.country / Client.country
      const countryObj = options.find((o) => o.value === data.countryIso);
      const countryName = countryObj?.label || null;

      const payload = {
        sellerId: data.sellerId,

        // USER
        userEmail: data.email,
        userPassword: data.password,
        userName: data.name || null,
        userPhone: data.phone || null,
        userCountry: countryName, // guardamos el nombre (p. ej., "Colombia")

        // CLIENT extra
        documentId: data.documentId || null,
        city: data.city || null,
        birthDate: data.birthDate || null,
        tags: data.tags || "",
        notes: data.notes || null,
        isArchived: !!data.isArchived,
      };

      const res = await fetch("/api/admin/clients/create-new-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast({
          title: "No se pudo crear el cliente",
          description: json?.error || "Error desconocido.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente creado",
        description: `Se creó ${json?.client?.name || "el cliente"} correctamente.`,
      });

      router.replace(`/dashboard-admin/clientes`);
      router.refresh();
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {/* Vendedor */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Vendedor *</label>
        <select
          {...register("sellerId", { required: true })}
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        >
          <option value="">Selecciona un vendedor…</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>
      </div>

      {/* Usuario (no se repiten luego en Client) */}
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email (usuario) *</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="usuario@correo.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Contraseña *</label>
          <input
            type="password"
            {...register("password", { required: true, minLength: 8 })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Mínimo 8 caracteres"
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <input
            type="text"
            {...register("name")}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Nombre completo"
          />
        </div>

        {/* País del usuario (y del cliente) con react-select tipado */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">País</label>
          <Controller
            name="countryIso" // guardamos ISO en el form
            control={control}
            render={({ field }) => (
              <Select<CountryOption, false, GroupBase<CountryOption>>
                options={options}
                // Convertimos el string ISO a opción completa
                value={options.find((o) => o.value === field.value) ?? null}
                // Guardamos sólo el ISO en el form
                onChange={(opt) => field.onChange(opt?.value ?? "")}
                onBlur={field.onBlur}
                placeholder="Selecciona un país…"
                classNamePrefix="rs"
                instanceId="country-select"
                isClearable
              />
            )}
          />
        </div>
      </div>

      {/* Teléfono internacional con selector de indicativo */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Teléfono (con indicativo)</label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              defaultCountry="co"
              value={field.value || ""}
              onChange={field.onChange}
              className="w-full"
              inputClassName="w-full rounded-md border px-3 py-2 text-sm"
            />
          )}
        />
        <p className="text-xs text-gray-500">
          Se guarda en formato internacional (E.164).
        </p>
      </div>

      <hr className="my-2" />

      {/* Solo campos adicionales de Client (sin duplicar email/phone/country) */}
      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Documento</label>
          <input
            type="text"
            {...register("documentId")}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="CC / Pasaporte"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Ciudad</label>
          <input
            type="text"
            {...register("city")}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Bogotá"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Fecha de nacimiento</label>
          <input
            type="date"
            {...register("birthDate")}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Tags (separados por coma)</label>
        <input
          type="text"
          {...register("tags")}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="VIP, Repetidor, Surf"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Notas</label>
        <textarea
          {...register("notes")}
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          placeholder="Observaciones, preferencias, etc."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isArchived"
          type="checkbox"
          {...register("isArchived")}
          className="h-4 w-4 rounded border"
        />
        <label htmlFor="isArchived" className="text-sm">
          Marcar como archivado
        </label>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || submitting}
          className="rounded-md bg-fuchsia-700 text-white px-5 py-2 text-sm font-medium shadow-sm hover:bg-fuchsia-800 disabled:opacity-60"
        >
          {isSubmitting || submitting ? "Creando..." : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}
