"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";

type MatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: () => void;
  currentUserImg: string;
  matchedUserImg: string;
  matchedUserName: string;
};

export function MatchModal({
  isOpen,
  onClose,
  onViewProfile,
  currentUserImg,
  matchedUserImg,
  matchedUserName,
}: MatchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          {/* Glow */}
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-purple-500/30 blur-3xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.8 }}
          />

          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
            className="bg-white rounded-3xl p-6 w-[90%] max-w-sm text-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-purple-700 mb-4">
              ¡Hay Match!
            </h2>

            <div className="flex justify-center items-center gap-4 mb-6">
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-600 shadow-lg"
              >
                <Image
                  src={currentUserImg}
                  alt="You"
                  fill
                  className="object-cover"
                />
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: "easeInOut",
                }}
              >
                <Heart className="text-purple-600 w-10 h-10" />
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-600 shadow-lg"
              >
                <Image
                  src={matchedUserImg}
                  alt={matchedUserName}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>

            {/* Botón para ver el perfil del usuario */}
            {onViewProfile && (
              <button
                onClick={onViewProfile}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-purple-700 transition font-semibold"
              >
                Ver perfil del viajero
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
