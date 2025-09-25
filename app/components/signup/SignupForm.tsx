/* eslint-disable react/display-name */
'use client'

import { useForm, type SubmitHandler, useWatch } from 'react-hook-form'
import { Input } from '../ui/InputLogin'
import { Button } from '../ui/Button'
import SignupLabel from './SignupLabel'
import PhoneInput from 'react-phone-number-input'
import { type SignupInputs } from '@/app/types/user'
import 'react-phone-number-input/style.css'
import { useEffect, useState } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { passwordStrength } from 'check-password-strength'
import PasswordStrength from './PasswordStrength'
import { cn } from '@/app/lib/utils'
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'
import { setCookie } from 'cookies-next'
import { ROUTE_ONBOARDING } from '@/app/constants/routes'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/hooks/useToast'

import { type User } from 'firebase/auth'
import Link from 'next/link'
import Image from 'next/image'

type FirebaseIdentityError = {
  code: string,
  message: string,
  errors: {
    message: string,
    domain: string,
    reason: string
  }[]

}

type Strength = 0 | 1 | 2 | 3

const SignupForm = () => {
  const { user, signUp } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>()
  const [strength, setStrength] = useState<Strength>(0)

  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control
  } = useForm<SignupInputs>()

  const passwordInput = useWatch({
    name: 'password',
    control
  })

  const onSubmitSignUp: SubmitHandler<SignupInputs> = async ({
    email,
    firstName,
    lastName,
    password
  }) => {
    try {
      await signUp({
        email,
        firstName: capitalizeFirstLetter(firstName),
        lastName: capitalizeFirstLetter(lastName),
        password,
        phoneNumber
      })
      const userData: User = user as User
      const idToken = await userData?.getIdToken()
      if (idToken) {
        setCookie('user', idToken, { path: ROUTE_ONBOARDING })
      }
      toast({
        title: 'Cuenta creada, vamos a completar la información de tu negocio.',
        variant: 'success'
      })
      router.push(`${ROUTE_ONBOARDING}`)
    } catch (error) {
      const firebaseError = error as FirebaseIdentityError;
      if (firebaseError && firebaseError.code) {
        const errorCode = firebaseError.code;
        if (errorCode === 'auth/email-already-in-use') {
          toast({
            title: 'Este correo electrónico ya está en uso. Intente con otro.',
            variant: 'default'
          });
          return;
        }
      }
      toast({
        title: 'Error al iniciar sesión. Verifica tu correo y contraseña.',
        variant: 'destructive'
      });
    }
  }

  useEffect(() => { setStrength(passwordStrength(passwordInput).id as Strength) }, [passwordInput])
  return (
    <div
      className="flex flex-col gap-4 lg:py-8 pb-4 pt-2 lg:px-16 px-4 bg-primary
      lg:rounded-tl-none lg:rounded-tr-none lg:rounded-bl-[5rem] lg:rounded-br-[5rem] w-full
      rounded-3xl lg:mb-0 mb-8"
    >
      <form
        onSubmit={handleSubmit(onSubmitSignUp)}
        className="flex flex-col gap-3"
      >
        <h1 className="text-white font-bold text-4xl text-center">
          Crea tu cuenta en Qik
        </h1>
        <div className="mt-2">
          <SignupLabel
            htmlFor="email"
          >
            Correo electrónico
          </SignupLabel>
          <Input
            type="email"
            name="email"
            register={register}
            placeholder='correo@empresa.com'
          />
        </div>
        <div>
          <SignupLabel
            htmlFor="firstName"
          >
            Nombre
          </SignupLabel>
          <Input
            type="text"
            name="firstName"
            register={register}
            placeholder='Nombre de la persona encargada de la empresa'
          />
        </div>
        <div>
          <SignupLabel
            htmlFor="lastName"
          >
            Apellido
          </SignupLabel>
          <Input
            type="text"
            name="lastName"
            register={register}
            placeholder='Apellido de la persona encargada de la empresa'
          />
        </div>
        <div>
          <SignupLabel
            htmlFor="phoneNumber"
          >
            Número de teléfono
          </SignupLabel>
          <PhoneInput
            className="phone-input"
            name="phoneNumber"
            defaultCountry="EC"
            required
            onChange={(value) => { setPhoneNumber(value) }}
            placeholder="0987654321"
          />
        </div>
        <div>
          <SignupLabel
            htmlFor="password"
          >
            Contraseña
          </SignupLabel>
          <Input
            type="password"
            name="password"
            register={register}
            placeholder='*********'
          />
          {passwordInput && <PasswordStrength strength={strength} />}
          <span className="text-white font-light text-xs">
            La contraseña debe tener al menos 10 caracteres, incluye
            letras, números y caracteres especiales para hacerla más segura.
          </span>
        </div>
        <div>
          <Button
            className={cn('w-full text-center text-base text-white bg-blue-950 py-6', {
              'cursor-not-allowed opacity-50': strength <= 2
            })}
            disabled={strength <= 2}
            variant="ghost"
          >
            Crear cuenta
          </Button>
        </div>
        <div className="flex flex-row gap-3 justify-center items-center">
            <p className="text-white font-normal text-sm">
              ¿Tienes una cuenta?
            </p>
            <Link
              className="text-white font-medium hover:underline"
              href="/login"
            >
              Inicia sesión
            </Link>
        </div>
        <div className="flex justify-center items-center mt-6">
            <Image
              src="/qik-powered-google.webp"
              alt="Powered by Google"
              width={150}
              height={150}
            />
        </div>
      </form>
    </div>
  )
}

export default SignupForm
