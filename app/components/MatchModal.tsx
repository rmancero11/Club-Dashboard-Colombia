import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";

type MatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUserImg: string;
  matchedUserImg: string;
  matchedUserName: string;
};

export function MatchModal({
  isOpen,
  onClose,
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
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 130, damping: 12 }}
            className="bg-white rounded-3xl p-6 w-[90%] max-w-sm text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-primary mb-4">
              Hay Match!
            </h2>

            {/* IMÁGENES */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500 shadow-lg">
                <Image src={currentUserImg} alt="You" fill className="object-cover" />
              </div>

              <Heart className="text-primary w-10 h-10" />

              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500 shadow-lg">
                <Image src={matchedUserImg} alt={matchedUserName} fill className="object-cover" />
              </div>
            </div>

            {/* TEXTO */}
            <p className="text-gray-700 text-lg mb-6">
              Tu y <strong>{matchedUserName}</strong> hicieron match 🎉
            </p>

            {/* BOTÓN */}
            <button
              onClick={onClose}
              className="w-full bg-primary text-white py-3 rounded-xl text-lg font-semibold shadow-md active:scale-95 transition"
            >
              ¡Seguir explorando!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
