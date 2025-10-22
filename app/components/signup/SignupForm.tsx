"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/app/components/ui/ButtonLogin";
import { Input } from "@/app/components/ui/InputLogin";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; 

type Inputs = {
  name: string;
  email: string;
  whatsapp?: string;     
  country?: string;
  password: string;
  confirmPassword: string;
  commissionRate?: string;
};

export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const redirectTarget = nextParam || "/dashboard-admin/vendedores";

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      country: "Colombia",
    },
  });

  const pwd = watch("password");

  const toE164 = (v?: string) => {
    if (!v) return "";
    const digits = String(v).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  };

  const waHref = (raw?: string) => {
    const e164 = toE164(raw);
    const digits = e164.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  };

  const onSubmit: SubmitHandler<Inputs> = async (values) => {
    if (values.password !== values.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          country: values.country || undefined,
          password: values.password,
          whatsapp: values.whatsapp ? toE164(values.whatsapp) : undefined,
          commissionRate:
            values.commissionRate && values.commissionRate !== ""
              ? Number(values.commissionRate)
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "No se pudo crear la cuenta",
          description: data.error || "Intenta de nuevo.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Cuenta creada",
        description: "Vendedor creado correctamente.",
        variant: "success",
      });

      router.replace(redirectTarget);
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my-auto relative flex flex-col gap-4 w-full max-w-[420px]"
    >
      <h2 className="text-2xl font-semibold">Crear cuenta de agente</h2>
      <p className="text-sm text-gray-600">
        Regístrate para acceder al dashboard de vendedores.
      </p>

      <div className="mt-2 flex flex-col gap-4 text-sm">
        <Input
          name="name"
          label="Nombre completo"
          register={register}
          placeholder="Tu nombre"
          required
        />

        <Input
          name="email"
          label="Email"
          type="email"
          register={register}
          placeholder="tucorreo@dominio.com"
          required
          autoComplete="email"
        />

        {/* === Teléfono/WhatsApp con selector de indicativo === */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">WhatsApp</label>

          <div className="relative">
            <Controller
              name="whatsapp"
              control={control}
              rules={{
                validate: (v) => !v || String(v).replace(/\D/g, "").length >= 8 || "Número inválido",
              }}
              render={({ field }) => (
                <PhoneInput
                  country={"co"}                 
                  value={field.value || ""}
                  onChange={(val) => field.onChange(val)}
                  inputProps={{
                    name: "whatsapp",
                    id: "whatsapp",
                    required: false,
                  }}
                  containerClass="!w-full"
                  inputClass="!w-full !py-2 !pl-12 !pr-14 !text-sm !border !rounded-md !border-gray-300 focus:!outline-none focus:!ring-1 focus:!ring-primary"
                  buttonClass="!border !border-gray-300 !rounded-l-md"
                  dropdownClass="!text-sm"
                  enableSearch
                  disableSearchIcon
                />
              )}
            />
          </div>

          {errors.whatsapp?.message && (
            <span className="text-xs text-red-600">{errors.whatsapp.message}</span>
          )}
        </div>

        <Input
          name="country"
          label="País"
          register={register}
          placeholder="Colombia"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            name="password"
            label="Contraseña"
            type="password"
            register={register}
            required
            autoComplete="new-password"
            minLength={6}
          />
          <Input
            name="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            register={register}
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <Input
          name="commissionRate"
          label="Comisión (%) (opcional)"
          type="number"
          step="0.01"
          min="0"
          register={register}
          placeholder="10.00"
        />
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-600">
        <input type="checkbox" required className="mt-1" />
        <span>
          Acepto los{" "}
          <a href="#" className="text-primary underline">
            Términos y Condiciones
          </a>
          .
        </span>
      </div>

      <div className="mt-1 flex flex-col justify-center items-center gap-3">
        <Button type="submit" variant="primary" loading={loading} disabled={loading}>
          Crear cuenta
        </Button>
      </div>
    </form>
  );
}
