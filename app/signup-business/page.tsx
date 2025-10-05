'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/app/components/ui/ButtonLogin";
import { Input } from "@/app/components/ui/InputLogin";

type Inputs = {
  businessName: string;
  country?: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupBusinessPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch } = useForm<Inputs>();
  const pwd = watch("password");

  const onSubmit: SubmitHandler<Inputs> = async (values) => {
    if (values.password !== values.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessName: values.businessName,
          country: values.country,
          ownerName: values.ownerName,
          email: values.email,
          password: values.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "No se pudo crear la empresa", description: data.error || "", variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Empresa creada", description: "Te llevamos al dashboard.", variant: "success" });
      router.replace("/dashboard-admin");
    } catch (e) {
      toast({ title: "Error de conexión", description: "Intenta nuevamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-dvh items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl space-y-4 rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Crear empresa de viajes</h1>
        <p className="text-sm text-gray-600">Crea tu agencia y obtén acceso de administrador.</p>

        <Input name="businessName" label="Nombre de la empresa" register={register} placeholder="Mi Agencia de Viajes" required />
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="country" label="País (opcional)" register={register} placeholder="CO" />
          <Input name="ownerName" label="Tu nombre" register={register} placeholder="Nombre del propietario" required />
        </div>
        <Input name="email" label="Email" type="email" register={register} placeholder="propietario@dominio.com" required autoComplete="email" />

        <div className="grid gap-3 md:grid-cols-2">
          <Input name="password" label="Contraseña" type="password" register={register} required minLength={6} autoComplete="new-password" />
          <Input name="confirmPassword" label="Confirmar contraseña" type="password" register={register} required minLength={6} autoComplete="new-password" />
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" required className="mt-1" />
          <span>Acepto los <a href="#" className="text-primary underline">Términos y Condiciones</a>.</span>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" loading={loading}>Crear empresa y continuar</Button>
        </div>
      </form>
    </main>
  );
}
