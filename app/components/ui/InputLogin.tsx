'use client';

import * as React from 'react';
import type { UseFormRegister } from 'react-hook-form';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  register: UseFormRegister<any>;
};

export function Input({ name, label, type = 'text', register, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <input
        type={type}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-0 focus:border-primary"
        {...register(name)}
        {...props}
      />
    </label>
  );
}
