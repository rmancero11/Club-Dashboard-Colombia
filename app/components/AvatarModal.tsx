"use client";

import * as React from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import type { User } from "@/app/types/user";
import AvatarModalMatchView from "./AvatarModalMatchView";

type AvatarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onNextUser?: () => void;
  userId: string;
  isMatchProfile?: boolean;
  currentUser?: User;
  likedUsers?: Record<string, boolean>;
  matchedUsers?: Record<string, boolean>;
  handleLike: (targetId: string) => Promise<boolean>;
};

export default function AvatarModal({
  isOpen,
  onClose,
  userId,
  isMatchProfile = false,
  likedUsers = {},
  matchedUsers = {},
  onNextUser,
  handleLike,
}: AvatarModalProps) {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const mountedRef = React.useRef(false);

  const [swipeDirection, setSwipeDirection] =
    React.useState<"left" | "right" | null>(null);

  const [actionFeedback, setActionFeedback] =
    React.useState<"like" | "nope" | null>(null);

  const [isDragging, setIsDragging] = React.useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);

  const likeOpacity = useTransform(x, [60, 140], [0, 0.25]);
  const nopeOpacity = useTransform(x, [-140, -60], [0.25, 0]);

  const borderColor = useTransform(x, [-120, 0, 120], [
    "rgba(239,68,68,0.6)",
    "rgba(255,255,255,0)",
    "rgba(34,197,94,0.6)",
  ]);

  const cardVariants = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exitLeft: {
      opacity: 0,
      x: -300,
      rotate: -12,
      transition: { duration: 0.25 },
    },
    exitRight: {
      opacity: 0,
      x: 300,
      rotate: 12,
      transition: { duration: 0.25 },
    },
  };

  const iconsMap: Record<string, { src: string; label: string }> = { playa: { src: "/favicon/playa-club-solteros.svg", label: "Playa" }, aventura: { src: "/favicon/aventura-club-solteros.svg", label: "Aventura" }, cultura: { src: "/favicon/cultura-club-solteros.svg", label: "Cultura" }, };

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Fetch error");
        const data = await res.json();
        if (!cancelled && mountedRef.current) {
          setUser(data.user ?? null);
        }
      } catch {
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

  if (loading || !user) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="bg-white rounded-xl p-6">
              Cargando...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (isMatchProfile) {
    return (
      <AvatarModalMatchView
        isOpen={isOpen}
        onClose={onClose}
        user={user}
        onNextUser={onNextUser}
      />
    );
  }

  const gustos: string[] = Array.isArray(user.preference)
    ? user.preference
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-purple-500 flex justify-center items-start"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key={user.id}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit={
              swipeDirection === "right"
                ? "exitRight"
                : swipeDirection === "left"
                ? "exitLeft"
                : undefined
            }
            drag="x"
            style={{ x, rotate, borderColor }}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setIsDragging(false);

              if (info.offset.x > 120) {
                setSwipeDirection("right");
                setActionFeedback("like");
                handleLike(user.id);

                setTimeout(() => {
                  setActionFeedback(null);
                  onNextUser?.();
                }, 220);
                return;
              }

              if (info.offset.x < -120) {
                setSwipeDirection("left");
                setActionFeedback("nope");

                setTimeout(() => {
                  setActionFeedback(null);
                  onNextUser?.();
                }, 220);
                return;
              }

              x.set(0);
            }}
            className="relative w-full max-w-md h-[calc(100dvh-64px)] bg-white overflow-hidden border-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={user.avatar || "/images/default-avatar.png"}
              alt={user.name}
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
              <div>
                <h2 className="text-3xl font-bold">{user.name}</h2>

                {user.country && (
                  <p className="mt-1 bg-white/20 px-3 py-1 rounded-full w-fit">
                    {user.country}
                  </p>
                )}

                {gustos?.length > 0 && (
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
                            <div key={i2} className="flex flex-col items-center gap-0.5 font-montserrat">
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
                )}
              </div>

              {!isDragging && (
                <div className="flex justify-between text-sm opacity-80">
                  <span className="font-montserrat">← Deslizá para NOPE</span>
                  <span className="font-montserrat">Deslizá para LIKE →</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
