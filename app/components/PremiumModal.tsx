"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type PremiumModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const router = useRouter();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-white rounded-2xl w-[90%] max-w-sm overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen de fondo */}
            <div className="relative h-64 w-full">
              <Image
                src="/images/imagenmodalpremium.jpg" // reemplazar con tu imagen real
                alt="Premium"
                fill
                className="object-cover"
              />
            </div>

            {/* Contenido principal */}
            <div className="p-4 flex flex-col items-center text-center space-y-3">
              <span className="bg-yellow-400 text-white font-bold px-4 py-1 rounded-full text-sm">
                PREMIUM
              </span>
              <h2 className="text-lg font-semibold">Viaja primero, conecta después</h2>
              <p className="text-gray-700 text-sm">
                La magia empieza disfrutando primero de un buen viaje
              </p>

              {/* Beneficios */}
              <ul className="w-full mt-2 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Image src="/favicon/iconosclub-21.svg" alt="" width={20} height={20} />
                  <div>
                    <p className="font-semibold text-sm">Nuevas historias en cada viaje</p>
                    <p className="text-gray-500 text-xs">La aventura empieza allá.</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Image src="/favicon/iconosclub-22.svg" alt="" width={20} height={20} />
                  <div>
                    <p className="font-semibold text-sm">Gente real, sin filtros</p>
                    <p className="text-gray-500 text-xs">Conecta cuando llegas.</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Image src="/favicon/iconosclub-23.svg" alt="" width={20} height={20} />
                  <div>
                    <p className="font-semibold text-sm">Planes para disfrutar</p>
                    <p className="text-gray-500 text-xs">Momentos que fluyen solos.</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Image src="/favicon/iconosclub-24.svg" alt="" width={20} height={20} />
                  <div>
                    <p className="font-semibold text-sm">Entorno seguro</p>
                    <p className="text-gray-500 text-xs">Viaja y conoce con tranquilidad.</p>
                  </div>
                </li>
              </ul>

              {/* Botón */}
              <button
  className="mt-4 w-full bg-purple-600 text-white font-semibold py-2 rounded-lg"
  onClick={() => router.push("/dashboard-user?tab=descubrir")}
>
  Descubrir destinos
</button>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-white text-2xl font-bold"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
