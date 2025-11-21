"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import PremiumModal from "./PremiumModal";
import type { User } from "@/app/types/user";
import AvatarModalMatchView from "./AvatarModalMatchView";

type AvatarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isMatchProfile?: boolean;
  currentUser?: User;
  likedUsers?: Record<string, boolean>;
  matchedUsers?: Record<string, boolean>;
  handleLike?: (targetId: string) => Promise<void>;
};

export default function AvatarModal({
  isOpen,
  onClose,
  userId,
  isMatchProfile = false,
  likedUsers = {},
  matchedUsers = {},
  handleLike,
}: AvatarModalProps) {
  const [isPremiumOpen, setIsPremiumOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch user
  React.useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Failed fetching user");
        const data = await res.json();
        if (!cancelled && mountedRef.current) setUser(data.user ?? null);
      } catch (err) {
        if (!cancelled && mountedRef.current) setUser(null);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  const iconsMap: Record<string, { src: string; label: string }> = {
    playa: { src: "/favicon/playa-club-solteros.svg", label: "Playa" },
    aventura: { src: "/favicon/aventura-club-solteros.svg", label: "Aventura" },
    cultura: { src: "/favicon/cultura-club-solteros.svg", label: "Cultura" },
  };

  // Loading skeleton
  if (loading || !user) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 rounded-2xl w-[90%] max-w-sm p-6 text-center"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <div className="animate-pulse space-y-4">
                <div className="mx-auto w-28 h-28 rounded-full bg-purple-300" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  //
  // 🚀 🚀 🚀 NUEVO CONTENIDO PRINCIPAL DEL MODAL (ANTES ESTABA EN !isMatchProfile)
  //
  if (isMatchProfile) {
    return (
      <AvatarModalMatchView
        isOpen={isOpen}
        onClose={onClose}
        user={user}
      />
    );
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
         <motion.div
  className="relative w-full max-w-md h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
  onClick={(e) => e.stopPropagation()}
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 200, transition: { duration: 0.35, ease: "easeInOut" } }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>

  <motion.button
    onClick={onClose}
    className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
    whileTap={{ scale: 0.9 }}
  >
    ✕
  </motion.button>
            {/* Imagen de fondo */}
            <Image
              src={user.avatar || "/images/default-avatar.png"}
              alt={user.name}
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/40" />

            {/* Contenido */}
            <div className="absolute inset-0 p-2 flex flex-col justify-between font-montserrat">
              <div className="flex flex-col gap-2 text-white">
                {/* Nombre */}
                <h2 className="text-3xl font-bold drop-shadow-lg">
                  {user.name}
                </h2>

                {/* País */}
                {user.country && (
                  <p className="text-base mt-1 bg-white/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm">
                    {user.country}
                  </p>
                )}

                {/* Preferencias */}
                {/* Preferencias */}
                {user.preference?.length > 0 ? (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {user.preference.map((p: string, i: number) => {
                      const key = p.toLowerCase();
                      const icon = iconsMap[key];
                      const items =
                        key === "mixto"
                          ? Object.values(iconsMap)
                          : icon
                          ? [icon]
                          : [];

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1 font-montserrat"
                        >
                          {items.map((it, i2) => (
                            <div
                              key={i2}
                              className="flex flex-col items-center gap-0.5 font-montserrat"
                            >
                              <Image
                                src={it.src}
                                alt={it.label}
                                width={28}
                                height={28}
                              />
                              <span className="text-xs text-white font-montserrat">
                                {it.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 mt-2 font-montserrat"></p>
                )}
              </div>

              {/* Botón Me gusta */}
              <div className="flex justify-center w-full mt-4">
                <motion.button
                  onClick={() => handleLike?.(user.id)}
                  disabled={matchedUsers[user.id]}
                  whileTap={{ scale: 1.5 }}
                  className={`transition rounded-full border ${
                    matchedUsers[user.id]
                      ? "border-green-400 bg-green-100 cursor-not-allowed"
                      : likedUsers[user.id]
                      ? "border-pink-400 bg-pink-100 hover:bg-pink-200"
                      : "border-gray-300 bg-white hover:bg-gray-100"
                  }`}
                >
                  <Image
                    src={
                      matchedUsers[user.id]
                        ? "/favicon/iconosclub-22.svg"
                        : likedUsers[user.id]
                        ? "/favicon/iconosclub-23.svg"
                        : "/favicon/iconosclub-21.svg"
                    }
                    alt="Like"
                    width={40}
                    height={40}
                  />
                </motion.button>
              </div>
            </div>

            {/* Premium Modal trigger */}
            {!isMatchProfile ? (
              <button
                onClick={() => setIsPremiumOpen(true)}
                className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow flex items-center justify-center border"
              >
                💬
              </button>
            ) : (
              <button
                onClick={() => window.location.assign(`/chat/${user.id}`)}
                className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow flex items-center justify-center border"
              >
                💬
              </button>
            )}

            {/* Premium Modal */}
            <AnimatePresence>
              {isPremiumOpen && (
                <motion.div
                  className="absolute inset-0 bg-black/60 flex items-center justify-center z-30"
                  onClick={() => setIsPremiumOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white rounded-xl w-[90%] max-w-sm p-4"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                  >
                    <PremiumModal
                      isOpen={isPremiumOpen}
                      onClose={() => setIsPremiumOpen(false)}
                    />
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
