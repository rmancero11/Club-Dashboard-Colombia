'use client'

import { useState } from 'react'

// forms
import { RegisterOptions, UseFormRegister } from 'react-hook-form'

// icons
import { Icon } from '@iconify/react'

interface InputProps {
  name: string
  label?: string
  type?: 'password' | 'email' | 'text'
  placeholder?: string
  register?: UseFormRegister<any> | null
  registerOptions?: RegisterOptions | null
}

export const Input = ({
  name,
  label,
  type = 'text',
  placeholder,
  register = null,
  registerOptions = null
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  const toggleShowPassword = () => setShowPassword(!showPassword)

  const registerInput = () => {
    if (!register) return {}
    if (!registerOptions) return register(name)
    return register(name, registerOptions)
  }

  return (
    <div className='w-full'>
      <label htmlFor={name} className='block text-sm font-medium leading-6 text-gray-700'>{label}</label>
      <div className='mt-1 flex items-center bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5'>
        <input
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          className='w-full outline-none border-none bg-white'
          required
          {...registerInput()}
          id={name}
        />
        <div onClick={toggleShowPassword} className='cursor-pointer'>
          {isPassword && showPassword && <Icon icon='mdi:eye' style={{ fontSize: '18px' }} />}
          {isPassword && !showPassword && <Icon icon='mdi:eye-off' style={{ fontSize: '18px' }} />}
        </div>
      </div>
    </div>
  )
}

Input.displayName = "Input"
