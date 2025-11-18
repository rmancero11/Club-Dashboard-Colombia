"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import PremiumModal from "./PremiumModal";
import type { User } from "@/app/types/user";

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
  currentUser,
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

  // Fetch user on open
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
        console.error("Error fetching user:", err);
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

  // iconsMap typed to avoid TS7053
  const iconsMap: Record<string, { src: string; label: string }> = {
    playa: { src: "/favicon/playa-club-solteros.svg", label: "Playa" },
    aventura: { src: "/favicon/aventura-club-solteros.svg", label: "Aventura" },
    cultura: { src: "/favicon/cultura-club-solteros.svg", label: "Cultura" },
  };

  // Animations
  const containerAnim = { hidden: { opacity: 0 }, show: { opacity: 1 } };
  const avatarAnim = {
    hidden: { scale: 0.9, opacity: 0 },
    show: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
  };

  // Loading skeleton
  if (loading || !user) {
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
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white/95 rounded-2xl w-[90%] max-w-sm p-6 text-center font-montserrat"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="animate-pulse space-y-4">
                <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-tr from-purple-200 to-purple-400" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Helper render for badges (gender / singleStatus)
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 shadow-sm font-montserrat">
      {children}
    </span>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerAnim}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4"
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background accent */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-purple-600 to-pink-400 opacity-30 blur-3xl"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-tr from-violet-700 to-purple-500 opacity-20 blur-3xl"></div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-1 z-20 text-white bg-purple-700/70 hover:bg-purple-700/90 px-3 py-1 rounded-full font-bold font-montserrat"
            >
              ✕
            </button>

            <div className="relative z-10 h-full flex flex-col">
              {/* Header / avatar area */}
              <div className="flex-shrink-0 p-6 flex items-center gap-4">
                <motion.div
                  initial="hidden"
                  animate="show"
                  className="relative"
                >
                  {/* avatar glow + border */}
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-pink-400 shadow-lg">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      <Image
                        src={user.avatar || "/images/default-avatar.png"}
                        alt={user.name ?? "Avatar"}
                        width={128}
                        height={128}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  {/* subtle ring */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: "0 8px 30px rgba(139,92,246,0.18)" }}
                  />
                </motion.div>

                <div className="flex flex-col">
                  <h3 className="text-2xl font-bold text-purple-900 font-montserrat">
                    {user.name}
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                    {/* Country */}
                    {user.country && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-sm font-medium text-purple-800 shadow-sm font-montserrat">
                        <span className="text-sm font-montserrat">🌍</span>
                        <span className="font-montserrat">{user.country}</span>
                      </div>
                    )}

                    {/* Gender */}
                    {user.gender && (
                      <Badge>
                        <span className="font-montserrat">{user.gender}</span>
                      </Badge>
                    )}

                    {/* Single status */}
                    {user.singleStatus !== undefined && (
                      <Badge>
                        <span className="font-montserrat">
                          {user.singleStatus ? "Soltero/a" : "No Soltero/a"}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 pt-0">
                {/* Preferences / tags */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-purple-800 mb-3 font-montserrat">
                    Preferencias
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {user.preference?.length ? (
                      user.preference.map((p: string, idx: number) => {
                        const key = p.toLowerCase();
                        const items =
                          key === "mixto"
                            ? Object.values(iconsMap)
                            : iconsMap[key]
                            ? [iconsMap[key]]
                            : [];

                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm border border-purple-100 font-montserrat"
                          >
                            {items.map((it, i2) => (
                              <Image
                                key={i2}
                                src={it.src}
                                alt={it.label}
                                width={22}
                                height={22}
                              />
                            ))}
                            <span className="text-sm font-medium text-purple-800 font-montserrat">
                              {p}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 font-montserrat">
                        Sin preferencias
                      </p>
                    )}
                  </div>
                </div>

                {/* About / comment */}
                {user.comment && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2 font-montserrat">
                      Sobre
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-purple-50 font-montserrat">
                      {user.comment}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-purple-100 flex items-center gap-3">
                <button
                  onClick={() => window.location.assign(`/perfil/${user.id}`)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-full font-semibold shadow-lg hover:scale-[1.01] transition-transform font-montserrat"
                >
                  Ver perfil completo
                </button>
                {!isMatchProfile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4"
                    onClick={onClose}
                  >
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      className="relative w-full max-w-md h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Imagen de fondo */}
                      <Image
                        src={user.avatar || "/images/default-avatar.png"}
                        alt={user.name ?? "Avatar"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />

                      {/* Contenido */}
                      <div className="absolute inset-0 p-2 flex flex-col justify-between font-montserrat">
                        <div className="flex flex-col gap-2 text-white">
                          {/* Nombre y país */}
                          <h2 className="text-3xl font-bold text-white drop-shadow-lg font-montserrat">
                            {user.name}
                          </h2>

                          {user.country && (
                            <p className="text-base mt-1 bg-white/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm font-montserrat">
                              {user.country}
                            </p>
                          )}

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
                                  <div key={i} className="flex items-center gap-1 font-montserrat">
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
                            <p className="text-sm text-gray-300 mt-2 font-montserrat">
                              Sin preferencias
                            </p>
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
                            } font-montserrat`}
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
                    </motion.div>
                  </motion.div>
                )}

                {/* If match, show direct chat button otherwise premium */}
                {isMatchProfile ? (
                  <button
                    onClick={() => {
                      window.location.assign(`/chat/${user.id}`);
                    }}
                    className="w-12 h-12 rounded-full bg-white border border-purple-200 flex items-center justify-center shadow font-montserrat"
                    title="Chatear"
                  >
                    💬
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPremiumOpen(true)}
                    className="w-12 h-12 rounded-full bg-white border border-purple-200 flex items-center justify-center shadow font-montserrat"
                    title="Chatear (Premium)"
                  >
                    💬
                  </button>
                )}
              </div>
            </div>

            {/* Premium modal */}
            <AnimatePresence>
              {isPremiumOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center z-30"
                  onClick={() => setIsPremiumOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-xl w-[90%] max-w-sm p-4 font-montserrat"
                    onClick={(e) => e.stopPropagation()}
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
