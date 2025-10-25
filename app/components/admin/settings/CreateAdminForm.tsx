"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/hooks/useToast";
import { ArrowLeft } from "lucide-react"; // ícono ligero y moderno

type FormValues = {
  name?: string;
  email: string;
  phone?: string;
  timezone?: string;
  password: string;
};

export default function CreateAdminForm() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({
          title: "No se pudo crear el administrador",
          description: json?.error || "Error desconocido.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Administrador creado",
        description: `Se creó ${json?.user?.email || "la cuenta"} correctamente.`,
        variant: "default",
      });

      router.replace("/dashboard-admin/configuracion");
      router.refresh();
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="relative w-full max-w-md rounded-xl border bg-white p-8 shadow-xl">
        {/* Botón volver */}
        <button
          type="button"
          onClick={() => router.push("/dashboard-admin/configuracion")}
          className="absolute left-4 top-4 flex items-center gap-2 text-sm font-medium text-fuchsia-700 hover:text-fuchsia-900 transition-colors"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <h1 className="mt-6 mb-6 text-center text-2xl font-semibold text-gray-800">
          Crear nuevo administrador
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <input
              type="text"
              {...register("name")}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-600"
              placeholder="Nombre del admin (opcional)"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Email *</label>
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-600"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Teléfono</label>
            <input
              type="tel"
              {...register("phone")}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-600"
              placeholder="+57 300 000 0000"
              autoComplete="tel"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Contraseña *</label>
            <input
              type="password"
              {...register("password", { required: true, minLength: 8 })}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-600"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-fuchsia-700 text-white px-6 py-2 text-sm font-medium shadow-sm hover:bg-fuchsia-800 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "Creando..." : "Crear administrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
