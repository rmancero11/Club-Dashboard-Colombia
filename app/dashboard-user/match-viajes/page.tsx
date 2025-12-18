"use client";

import { useEffect, useState } from "react";
import AvatarModal from "@/app/components/AvatarModal";
import { MatchModal } from "@/app/components/MatchModal";
import type { TravelerDTO } from "@/app/types/destination";
import type { User } from "@/app/types/user";

const SEEN_USERS_KEY = "seen_users";

export default function TravelersMatchList() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [travelers, setTravelers] = useState<TravelerDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [likedUsers, setLikedUsers] = useState<Record<string, boolean>>({});
  const [matchedUsers, setMatchedUsers] = useState<Record<string, boolean>>({});
  const [seenUsers, setSeenUsers] = useState<Record<string, boolean>>({});
  const [seenLoaded, setSeenLoaded] = useState(false);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUserInfo, setMatchedUserInfo] = useState<{
    avatar: string;
    name: string;
  } | null>(null);

  const currentTraveler = travelers[currentIndex];

  /* =========================
     Cargar vistos (1 sola vez)
  ========================= */
  useEffect(() => {
    const stored = localStorage.getItem(SEEN_USERS_KEY);
    if (stored) {
      setSeenUsers(JSON.parse(stored));
    }
    setSeenLoaded(true);
  }, []);

  /* =========================
     Persistir vistos
  ========================= */
  useEffect(() => {
    if (seenLoaded) {
      localStorage.setItem(SEEN_USERS_KEY, JSON.stringify(seenUsers));
    }
  }, [seenUsers, seenLoaded]);

  /* =========================
     Fetch usuario actual
  ========================= */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const { user } = await res.json();
        setCurrentUser(user);
      } catch {
        setError("No se pudo obtener el usuario actual");
      }
    };

    fetchCurrentUser();
  }, []);

  /* =========================
     Fetch usuarios (una vez)
  ========================= */
  useEffect(() => {
    if (!currentUser || !seenLoaded) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/users?excludeUserId=${currentUser.id}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error();
        const { users } = await res.json();

        const filtered = users.filter(
          (u: TravelerDTO) => !seenUsers[u.id]
        );

        setTravelers(filtered);
        setCurrentIndex(0);
      } catch (err: any) {
        setError(err.message || "Error cargando usuarios");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, seenLoaded]);

  /* =========================
     Like / Match
  ========================= */
  const handleLike = async (targetId: string): Promise<boolean> => {
    if (!currentUser || matchedUsers[targetId]) return false;

    const res = await fetch("/api/match/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: currentUser.id,
        toUserId: targetId,
      }),
    });

    const data = await res.json();

    setLikedUsers((prev) => ({ ...prev, [targetId]: true }));
    setSeenUsers((prev) => ({ ...prev, [targetId]: true }));

    setTravelers((prev) => prev.filter((u) => u.id !== targetId));

    if (data.matched) {
      setMatchedUsers((prev) => ({ ...prev, [targetId]: true }));

      const matchedUser = travelers.find((t) => t.id === targetId);
      if (matchedUser) {
        setMatchedUserInfo({
          avatar: matchedUser.avatar || "/images/default-avatar.png",
          name: matchedUser.name || "Viajero",
        });
      }

      setShowMatchModal(true);
      return true;
    }

    return false;
  };

  /* =========================
     Dislike
  ========================= */
  const handleNextUser = () => {
    if (!currentTraveler) return;

    setSeenUsers((prev) => ({ ...prev, [currentTraveler.id]: true }));
    setTravelers((prev) =>
      prev.filter((u) => u.id !== currentTraveler.id)
    );
  };

  /* =========================
     UI
  ========================= */
  if (loading) {
    return <p className="text-center text-gray-500 mt-6">Cargando viajeros…</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-6">{error}</p>;
  }

  if (!currentTraveler) {
    return (
      <p className="text-center text-gray-500 mt-6">
        No hay más viajeros disponibles
      </p>
    );
  }

  return (
    <>
      <AvatarModal
        isOpen={true}
        onClose={() => {}}
        userId={currentTraveler.id}
        isMatchProfile={!!matchedUsers[currentTraveler.id]}
        likedUsers={likedUsers}
        matchedUsers={matchedUsers}
        handleLike={handleLike}
        onNextUser={handleNextUser}
      />

      {showMatchModal && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          currentUserImg={
            currentUser?.avatar || "/images/default-avatar.png"
          }
          matchedUserImg={
            matchedUserInfo?.avatar || "/images/default-avatar.png"
          }
          matchedUserName={matchedUserInfo?.name || "Viajero"}
        />
      )}
    </>
  );
}
