'use client';

import { useMemo } from 'react';
import countries from 'i18n-iso-countries';
import es from 'i18n-iso-countries/langs/es.json';

countries.registerLocale(es);

type Props = {
  name?: string;
  defaultValue?: string;   // nombre del país guardado en tu BD (schema actual)
  required?: boolean;
  className?: string;
  placeholder?: string;
};

export default function CountrySelect({
  name = 'country',
  defaultValue = '',
  required = false,
  className = 'rounded-md border px-3 py-2',
  placeholder = 'Selecciona un país',
}: Props) {
  const options = useMemo(() => {
    // Obtenemos nombres oficiales en español
    const entries = Object.entries(
      countries.getNames('es', { select: 'official' })
    ) as Array<[string, string]>;
    // entries = [['CO','Colombia'], ...]
    return entries
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, []);

  return (
    <select
      name={name}
      defaultValue={defaultValue || ''}
      required={required}
      className={className}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        // IMPORTANTE: como tu schema guarda `country` como String,
        // usamos el NOMBRE del país como value para no cambiar nada del backend.
        <option key={o.code} value={o.label}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
