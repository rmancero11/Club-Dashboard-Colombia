"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/app/components/ui/ButtonLogin";
import { Input } from "@/app/components/ui/InputLogin";
import Image from "next/image";
import ForgotPasswordPanel from "@/app/components/auth/ForgotPasswordPanel";

type Inputs = { email: string; password: string };

export default function LoginPageClient({
}: {
}) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async ({ email, password }) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({
          title: "Error al iniciar sesión",
          description: data.error || "Verifica tu correo y contraseña.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const role = String(data?.user?.role || "").toUpperCase();
      if (role === "ADMIN") router.replace("/dashboard-admin");
      else if (role === "SELLER") router.replace("/dashboard-seller");
      else if (role === "USER") router.replace("/dashboard-user");
      else router.replace("/unauthorized");
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

  function loginDemo(): void {
    toast({ title: "Demo no implementada", variant: "default" });
  }

  return (
    <section>
      <div className="flex items-center h-screen">
        <div className="z-[1000] w-full md:w-2/5 h-full flex flex-col items-center">
          {!isDemo && !showForgot && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="my-auto relative flex flex-col gap-4 w-full max-w-[400px] px-8"
            >
              <div className="flex flex-col gap-2 items-center">
                <h4 className="flex items-center text-primary text-3xl md:text-5xl">
                  <Image
                    src="/images/logo-1000-viajeros-w.png"
                    className="h-25 w-auto"
                    alt="logo"
                    width={250}
                    height={250}
                    priority
                  />
                </h4>
                <p className="text-gray-600 text-center font-medium max-w-[200px] md:max-w-full">
                  Únete a experiencias únicas
                </p>
              </div>

              <div className="mt-20 md:mt-8 flex flex-col gap-4 text-sm">
                <Input
                  name="email"
                  label="Email"
                  type="email"
                  register={register}
                  autoComplete="email"
                />
                <Input
                  name="password"
                  label="Password"
                  type="password"
                  register={register}
                  autoComplete="current-password"
                />
                <div className="mt-2 w-full" />
                <div className="flex flex-col justify-center items-center gap-3">
                  <Button type="submit" variant="primary" loading={loading}>
                    Iniciar sesión
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="w-full cursor-pointer text-center hover:text-primary hover:font-bold duration-200 font-sans"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          )}

          {!isDemo && showForgot && (
            <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
          )}

          {isDemo && (
            <div className="my-auto relative flex flex-col gap-4 w-full max-w-[400px] px-8">
              {/* corregido: w/full -> w-full */}
              <div className="flex justify-center items-center text-primary text-3xl md:text-5xl">
                <Image
                  src="/logoclubsolteros.svg"
                  className="flex h-20"
                  alt="logo"
                  width={75}
                  height={80}
                />
              </div>
              <Button onClick={loginDemo} type="button" loading={loading}>
                Start demo
              </Button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-primary">
            <p className="text-xs">Powered by</p>
          </div>
        </div>

        <div className="fixed hidden md:relative top-0 md:flex w-full md:w-3/5 h-[30vh] md:h-full rounded-bl-full rounded-br-full md:rounded-br-none md:rounded-tl-full md:rounded-l-full overflow-hidden bg-gradient-to-b relative">
          <Image
            src="/images/rome.jpg"
            alt="banner"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="hidden md:flex bg-black/40 absolute inset-0 md:rounded-tl-full md:rounded-l-full z-[10000]" />
        </div>
      </div>
    </section>
  );
}
