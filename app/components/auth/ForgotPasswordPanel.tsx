"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/app/components/ui/ButtonLogin";
import { Input } from "@/app/components/ui/InputLogin";
import { useToast } from "@/app/hooks/useToast";

type FormVals = { email: string };

export default function ForgotPasswordPanel({
  onBack,
}: {
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<FormVals>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }: FormVals) => {
    setLoading(true);
    try {
      await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast({
        title: "Si el correo existe, te enviamos el enlace",
        description: "Revisa tu bandeja de entrada y spam.",
        variant: "default",
      });
      reset();
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo enviar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-auto relative flex flex-col gap-4 w-full max-w-[400px] px-8">
      <h1 className="text-2xl font-bold text-center">Recuperar contraseña</h1>

      {sent ? (
        <p className="text-sm text-center">
          Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            name="email"
            label="Email"
            type="email"
            register={register}
            autoComplete="email"
          />
          <Button type="submit" variant="primary" loading={loading}>
            Enviar enlace
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-2 text-center text-sm text-primary hover:font-semibold"
      >
        Volver al login
      </button>
    </div>
  );
}
