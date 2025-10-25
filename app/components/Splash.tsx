"use client";

import { useEffect, useState } from "react";

export default function Splash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Oculta el splash tras el primer render + un ligero retardo
    const t = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] grid place-items-center bg-white/90 backdrop-blur transition-opacity duration-500"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Logo / Marca */}
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-700 to-violet-600 shadow-lg grid place-items-center text-white text-2xl font-semibold">
          CS
        </div>
        <p className="text-sm text-gray-700">Cargando ClubSolteros…</p>

        {/* Indicador simple de carga */}
        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/3 animate-[load_1.1s_ease-in-out_infinite] bg-gradient-to-r from-fuchsia-700 to-violet-600" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes load {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(50%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
