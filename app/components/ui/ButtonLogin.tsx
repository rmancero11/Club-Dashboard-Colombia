'use client';

import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
};

export function Button({
  children,
  loading = false,
  className = '',
  variant = 'outline',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition';
  const styles: Record<string, string> = {
    primary:
      'bg-primary text-white hover:bg-primary/90 border border-primary shadow-md disabled:opacity-60',
    outline:
      'bg-white text-primary hover:bg-primary hover:text-white border border-primary shadow-md disabled:opacity-60',
    ghost:
      'bg-transparent text-primary hover:bg-primary/10 border border-transparent disabled:opacity-60',
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
      )}
      {children}
    </button>
  );
}
