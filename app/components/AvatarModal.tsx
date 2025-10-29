"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import PremiumModal from "./PremiumModal";

type AvatarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  avatar: string;
  name?: string | null;
  country?: string | null;
  preferences?: string[];
  nextDestination?: string;
  loading?: boolean;
  onChangeAvatar?: (file: File) => void;
  verified?: boolean;
};

export default function AvatarModal({
  isOpen,
  onClose,
  avatar,
  name,
  country,
  preferences = [],
  nextDestination,
  verified,
  loading = false,
  onChangeAvatar,
}: AvatarModalProps) {
  const [isPremiumOpen, setIsPremiumOpen] = React.useState(false);

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
            className="bg-white rounded-2xl w-[90%] max-w-sm h-[80%] relative flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen de fondo */}
            <Image
              src={avatar}
              alt={name ?? "Avatar"}
              fill
              className="object-cover"
            />

            {/* Overlay info */}
<div className="absolute top-4 left-4 text-white font-montserrat flex flex-col items-start gap-2">
  {/* Nombre y verificación */}
  <div className="flex items-center gap-2">
    <h2 className="text-lg font-semibold">{name}</h2>
    {verified && (
      <Image
        src="/favicon/check-aprobacion-club-solteros.svg"
        alt="Verificado"
        width={20}
        height={20}
      />
    )}
  </div>

  {/* País */}
  {country && (
    <p className="text-sm bg-white/90 text-black px-3 py-1 rounded-full shadow-sm">
      {country}
    </p>
  )}

  {/* Preferencias */}
  {preferences.length > 0 ? (
    <ul className="flex items-center m-0 p-0 list-none">
      {preferences.map((g, i) => {
        const icons: string[] = [];
        if (g.toLowerCase() === "playa") icons.push("/favicon/playa-club-solteros.svg");
        if (g.toLowerCase() === "aventura") icons.push("/favicon/aventura-club-solteros.svg");
        if (g.toLowerCase() === "cultura") icons.push("/favicon/cultura-club-solteros.svg");
        if (g.toLowerCase() === "mixto")
          icons.push(
            "/favicon/playa-club-solteros.svg",
            "/favicon/aventura-club-solteros.svg",
            "/favicon/cultura-club-solteros.svg"
          );

        return (
          <li key={i} className="flex items-center gap-1">
            {icons.map((icon, idx) => (
              <Image
                key={idx}
                src={icon}
                alt={g}
                width={28}
                height={28}
              />
            ))}
          </li>
        );
      })}
    </ul>
  ) : (
    <p className="text-gray-300 text-sm">No especificado</p>
  )}
</div>



            {/* Sección inferior */}
            <div className="absolute bottom-4 w-full flex flex-col items-center gap-2 font-montserrat">
              {nextDestination && (
                <>
                  <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-montserrat">
                    Próximo destino
                  </span>
                  <p className="text-black font-semibold text-center font-montserrat">
                    {nextDestination}
                  </p>
                </>
              )}

              {/* Botón chatear */}
              <button
                className="mt-2 w-12 h-12 bg-white rounded-full flex items-center justify-center transition"
                onClick={() => setIsPremiumOpen(true)}
              >
                <Image
                  src="/favicon/mensajes-club-solteros.svg"
                  alt="Chatear"
                  width={24}
                  height={24}
                />
              </button>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-white text-2xl font-bold"
            >
              ✕
            </button>

            {/* Modal de chat */}
            <AnimatePresence>
              {isPremiumOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute inset-0 z-50 bg-black/70 flex justify-center items-center"
                  onClick={() => setIsPremiumOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="bg-white rounded-xl w-[80%] max-w-xs p-4 relative font-montserrat"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PremiumModal
                      isOpen={isPremiumOpen}
                      onClose={() => setIsPremiumOpen(false)}
                    />
                    <button
                      onClick={() => setIsPremiumOpen(false)}
                      className="absolute top-2 right-2 text-black text-xl font-bold"
                    >
                      ✕
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
