"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/app/components/ui/ButtonLogin";
import { Input } from "@/app/components/ui/InputLogin";
import { useToast } from "@/app/hooks/useToast";

type FormVals = { password: string; confirm: string };

export default function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<FormVals>();
  const [loading, setLoading] = useState(false);

  async function onSubmit({ password, confirm }: FormVals) {
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error === "expired"
            ? "El enlace expiró."
            : data?.error === "used"
            ? "El enlace ya fue usado."
            : "Enlace inválido.";
        toast({ title: "No se pudo actualizar", description: msg, variant: "destructive" });
        return;
      }

      toast({ title: "Contraseña actualizada", description: "Ahora puedes iniciar sesión." });
      router.replace("/login");
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Crear nueva contraseña</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          name="password"
          label="Nueva contraseña"
          type="password"
          register={register}
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <Input
          name="confirm"
          label="Confirmar contraseña"
          type="password"
          register={register}
          minLength={8}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" loading={loading}>
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
