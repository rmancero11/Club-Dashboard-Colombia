'use client'

import { useForm, type SubmitHandler, useWatch } from 'react-hook-form'
import { Input } from '../ui/InputLogin'
import { Button } from '../ui/Button'
import PasswordStrength from './PasswordStrength'
import { useState, useEffect } from 'react'
import { passwordStrength } from 'check-password-strength'
import { cn } from '@/app/lib/utils'

type SignupInputs = {
  name: string
  email: string
  phone: string
  password: string
}

type Strength = 0 | 1 | 2 | 3

const SignupFormAdmin = () => {
  const { register, handleSubmit, control, reset } = useForm<SignupInputs>()
  const [strength, setStrength] = useState<Strength>(0)
  const [message, setMessage] = useState<string | null>(null)

  const passwordInput = useWatch({
    name: 'password',
    control,
  })

  const onSubmit: SubmitHandler<SignupInputs> = async (data) => {
    try {
      const response = await fetch('/api/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setMessage('✅ Administrador creado exitosamente')
        reset()
      } else {
        setMessage('❌ ' + (result.message || 'No se pudo registrar'))
      }
    } catch (err) {
      setMessage('❌ Error de conexión con el servidor')
    }
  }

  useEffect(() => {
    if (passwordInput) {
      setStrength(passwordStrength(passwordInput).id as Strength)
    }
  }, [passwordInput])

  return (
    <div className="flex flex-col gap-4 p-8 bg-primary rounded-3xl w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <h1 className="text-white font-bold text-3xl text-center">
          Registro de Administrador
        </h1>

        <Input
          name="name"
          label="Nombre"
          placeholder="Nombre completo"
          register={register}
          registerOptions={{ required: true }}
        />

        <Input
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="admin@empresa.com"
          register={register}
          registerOptions={{ required: true }}
        />

        <Input
          name="phone"
          label="Teléfono"
          placeholder="0987654321"
          register={register}
        />

        <div>
          <Input
            name="password"
            type="password"
            label="Contraseña"
            placeholder="********"
            register={register}
            registerOptions={{ required: true }}
          />
          {passwordInput && <PasswordStrength strength={strength} />}
        </div>

        <Button
          type="submit" // 👈 IMPORTANTE
          className={cn('w-full text-base text-white bg-blue-700 py-3', {
            'cursor-not-allowed opacity-50': strength <= 2,
          })}
          disabled={strength <= 2}
        >
          Crear administrador
        </Button>

        {message && <p className="text-center text-sm text-white">{message}</p>}
      </form>
    </div>
  )
}

export default SignupFormAdmin
