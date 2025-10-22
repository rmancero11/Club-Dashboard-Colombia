"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/app/components/ui/ButtonLogin";
import { Input } from "@/app/components/ui/InputLogin";

type Inputs = {
  name: string;
  email: string;
  whatsapp?: string;     // UI field -> se mapeará a whatsappNumber
  country?: string;
  password: string;
  confirmPassword: string;
  commissionRate?: string; // UI string -> se convierte a number (Decimal)
};

export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm<Inputs>();
  const pwd = watch("password");

  const onSubmit: SubmitHandler<Inputs> = async (values) => {
    if (values.password !== values.confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // Campos del modelo User
          name: values.name,
          email: values.email,
          country: values.country || undefined,
          password: values.password,
          // Ajuste al schema:
          whatsappNumber: values.whatsapp || undefined,
          commissionRate:
            values.commissionRate !== undefined && values.commissionRate !== ""
              ? Number(values.commissionRate)
              : undefined,
          // El rol SELLER debe asignarlo el endpoint (o puedes enviarlo si tu API lo permite)
          // role: "SELLER",
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
        description: "Bienvenido al panel de vendedores.",
        variant: "success",
      });

      // El endpoint setea cookie y loguea; redirigimos al dashboard
      router.replace("/dashboard-seller");
    } catch (e) {
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
        <Input
          name="whatsapp"
          label="WhatsApp"
          register={register}
          placeholder="+57 300 000 0000"
        />
        <Input
          name="country"
          label="País"
          register={register}
          placeholder="CO"
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
        {/* businessSlug eliminado: no existe en el schema */}
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
        <Button type="submit" variant="primary" loading={loading}>
          Crear cuenta
        </Button>
      </div>
    </form>
  );
}
