"use client";

import { useEffect, useMemo, useState } from "react";

function toInputDateString(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarBadge({
  initialDate,
  onChange,
  maxToday = true,
}: {
  initialDate?: string; // "YYYY-MM-DD"
  onChange?: (isoDate: string) => void;
  maxToday?: boolean;
}) {
  const todayIso = useMemo(() => toInputDateString(new Date()), []);
  const [value, setValue] = useState<string>(initialDate || todayIso);

  // 👇 si la prop cambia (p.ej., navegación con otra asOf), sincroniza el input
  useEffect(() => {
    setValue(initialDate || todayIso);
  }, [initialDate, todayIso]);

  return (
    <div className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1">
      <span className="text-xs text-gray-600">Actualizado al</span>
      <input
        type="date"
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          onChange?.(v);
        }}
        max={maxToday ? todayIso : undefined}
        aria-label="Seleccionar fecha de actualización"
      />
    </div>
  );
}
