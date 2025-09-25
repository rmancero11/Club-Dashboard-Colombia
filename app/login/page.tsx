'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { User } from 'firebase/auth';

import { useForm, SubmitHandler } from 'react-hook-form';

import { useAuth } from '@/app/hooks/useAuth';

import { setCookie } from 'cookies-next';

import { useToast } from '@/app/hooks/useToast';
import { Button } from '@/app/components/ui/ButtonLogin';
import { Input } from '@/app/components/ui/InputLogin';
import Image from 'next/image';

import {
  ROUTE_DASHBOARD,
  ROUTE_DASHBOARD_HOME,
  ROUTE_STADISTICS,
} from '@/app/constants/routes';
import Link from 'next/link';

type Inputs = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { toast } = useToast();
  const { user, signIn } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async ({ email, password }) => {
    setLoading(true);
    try {
      await signIn(email, password);
      const userData: User = user as User;
      const idToken = await userData?.getIdToken();
      if (idToken) {
        setCookie('user', idToken, { path: ROUTE_DASHBOARD });
      }
      router.push(`${ROUTE_DASHBOARD_HOME}`);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al iniciar sesión. Verifica tu correo y contraseña.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const loginDemo = async () => {
    setLoading(true);
    const email = process.env.NEXT_PUBLIC_VITE_APP_DEMO_EMAIL;
    const password = process.env.NEXT_PUBLIC_VITE_APP_DEMO_PASSWORD;

    try {
      await signIn(email || '', password || '');
      const userData: User = user as User;
      const idToken = await userData?.getIdToken();
      if (idToken) {
        setCookie('user', idToken, { path: ROUTE_DASHBOARD });
      }
      router.push(`${ROUTE_STADISTICS}`);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al iniciar sesión. Verifica tu correo y contraseña.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <>
      <section>
        <div className="flex items-center h-screen">
          <div className="z-[1000] w-full md:w-2/5 h-full flex flex-col items-center">
            {!isDemo && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="my-auto relative flex flex-col gap-4 w-full max-w-[400px] px-8">
                <div className="flex flex-col gap-2 items-center">
                  <h4 className="flex items-center text-primary text-3xl md:text-5xl">
                    <Image
                      src="/isologoazul.webp"
                      className="flex h-20"
                      alt="logo"
                      width={75}
                      height={80}
                    />
                    <span className="font-bold">Qik</span>
                    <p>starts</p>
                  </h4>
                  <p className="text-gray-600 text-center font-medium max-w-[200px] md:max-w-full">
                    El éxito de tu marca es la voz de tu cliente
                  </p>
                </div>
                <div className="mt-20 md:mt-8 flex flex-col gap-4 text-sm">
                  <Input
                    name="email"
                    label="Email"
                    type="email"
                    register={register}
                  />
                  <Input
                    name="password"
                    label="Password"
                    type="password"
                    register={register}
                  />
                  <div className="mt-2 w-full" />
                  <div className="flex flex-col justify-center items-center gap-3">
                    <Button type="submit" variant="primary" loading={loading}>
                      Iniciar sesión
                    </Button>
                    <Link
                      className="flex justify-center gap-2  px-4 py-3 bg-white text-primary hover:bg-primary
                      hover:text-white border hover:border-primary w-full text-center rounded-md duration-200
                      shadow-md"
                      href="/signup">
                      Crear una cuenta
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="cursor-pointer text-center hover:text-primary hover:font-bold duration-200 font-sans">
                    Forgot your password?
                  </div>
                </div>
              </form>
            )}

            {isDemo && (
              <div className="my-auto relative flex flex-col gap-4 w-full max-w-[400px] px-8">
                <div className="flex justify-center items-center text-primary text-3xl md:text-5xl">
                  <Image
                    src="/isologoazul.webp"
                    className="flex h-20"
                    alt="logo"
                    width={75}
                    height={80}
                  />
                  <span className="font-bold">Qik</span>
                  <p>starts</p>
                </div>
                <Button onClick={loginDemo} type="button" loading={loading}>
                  Start demo
                </Button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-primary">
              <p className="text-xs">Powered by</p> 
              <Image
                src="/google.svg"
                alt="google"
                className="mt-1 h-10 w-auto"
                width={56}
                height={24}
              />
            </div>
          </div>
          <div className="fixed hidden md:relative top-0 md:flex w-full md:w-3/5 h-[30vh] md:h-full rounded-bl-full rounded-br-full md:rounded-br-none md:rounded-tl-full md:rounded-l-full overflow-hidden bg-gradient-to-b">
            <Image
              src="/loginbanner.webp"
              alt="banner"
              className="absolute z-0 w-full h-full object-cover"
              width={2048}
              height={1365}
              priority
            />
            <div className="md:hidden absolute md:static top-0 left-0 w-full h-full bg-gradient-to-b from-black/80 to/black/10" />
            <div className="hidden md:flex bg-black/40 sticky top-0 right-0 w-full h-full md:rounded-tl-full md:rounded-l-full z-[10000]" />
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginPage;
