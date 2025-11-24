"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPortal } from "react-dom";
import AvatarModal from "@/app/components/AvatarModal";
import { MatchModal } from "@/app/components/MatchModal";
import { motion } from "framer-motion";
import type { DestinationDTO, TravelerDTO } from "@/app/types/destination";
import type { User } from "@/app/types/user";
import { getCode } from "country-list";

export default function TravelersMatchList() {
  const router = useRouter();

  const [destinos, setDestinos] = useState<DestinationDTO[]>([]);
  const [travelersByDest, setTravelersByDest] = useState<
    Record<string, TravelerDTO[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [selectedTraveler, setSelectedTraveler] = useState<TravelerDTO | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [likedUsers, setLikedUsers] = useState<Record<string, boolean>>({});
  const [matchedUsers, setMatchedUsers] = useState<Record<string, boolean>>({});
  const [showMatchModal, setShowMatchModal] = useState(false);
const [matchedUserInfo, setMatchedUserInfo] = useState<{
  avatar: string;
  name: string;
} | null>(null);




  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo obtener el usuario actual");

        const { user } = await res.json();
        setCurrentUser(user);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => setMounted(true), []);

  // 🧠 Cargar destinos + viajeros asociados
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/destination", { cache: "no-store" });
    if (!res.ok) throw new Error("Error al cargar destinos");

    const { items } = await res.json();
    setDestinos(items);

    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

    // ❗ 1 sola llamada para todos los usuarios
    const userRes = await fetch(
      `/api/users?excludeUserId=${currentUser.id}`,
      { cache: "no-store" }
    );

    const { users } = await userRes.json();

    const travelersData: Record<string, TravelerDTO[]> = {};

    // Filtrar usuarios por cada destino
    for (const dest of items) {
      const normalizedDest = normalizeText(dest.name);

      const matchingTravelers = users.filter((trav: TravelerDTO) =>
        trav.destino.some((d) => {
          const nd = normalizeText(d);

          return (
            (nd.includes("cancun") && normalizedDest.includes("cancun")) ||
            (nd.includes("temptation") && normalizedDest.includes("temptation")) ||
            nd.split(" ").some((word) => normalizedDest.includes(word))
          );
        })
      );

      travelersData[dest.id] = matchingTravelers;
    }

    setTravelersByDest(travelersData);
  } catch (err: any) {
    console.error("❌ Error:", err);
    setError(err.message || "Error desconocido");
  } finally {
    setLoading(false);
  }
};


    fetchData();
  }, [currentUser]);

  // Scroll del carrusel
  const scroll = (destinoId: string, direction: "left" | "right") => {
    const ref = carouselRefs.current[destinoId];
    if (!ref) return;

    const width = ref.clientWidth;

    ref.scrollBy({
      left: direction === "left" ? -width / 2 : width / 2,
      behavior: "smooth",
    });
  };

  useEffect(() => {
  if (!currentUser) return;

  const fetchMatchStatus = async () => {
    try {
      const res = await fetch(`/api/match/status?userId=${currentUser.id}`);
      const data = await res.json();

      // Guardar likes previos
      const likes: Record<string, boolean> = {};
      data.likesSent.forEach((id: string) => (likes[id] = true));
      setLikedUsers(likes);

      // Guardar matches previos
      const matches: Record<string, boolean> = {};
      data.matches.forEach((id: string) => (matches[id] = true));
      setMatchedUsers(matches);
    } catch (err) {
      console.error("Error loading match status", err);
    }
  };

  fetchMatchStatus();
}, [currentUser]);


  // ❤️ Like / Unlike / Match
  const handleLike = async (targetId: string) => {
    if (!currentUser) return;

    // ⛔ Si ya hubo MATCH → no se puede tocar
    if (matchedUsers[targetId]) return;

    // 💔 Si ya le diste like → UNLIKE
    if (likedUsers[targetId]) {
      try {
        const res = await fetch("/api/match/unlike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: currentUser.id,
            toUserId: targetId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "No se pudo remover el like");
          return;
        }

        setLikedUsers((prev) => {
          const newState = { ...prev };
          delete newState[targetId];
          return newState;
        });

        return;
      } catch (err) {
        console.error(err);
        return;
      }
    }

    // ❤️ Enviar nuevo LIKE
    try {
      const res = await fetch("/api/match/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: targetId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo enviar el like");
        return;
      }

      setLikedUsers((prev) => ({ ...prev, [targetId]: true }));

      // 🎉 Si hubo MATCH
      if (data.matched) {
  setMatchedUsers((prev) => ({ ...prev, [targetId]: true }));

  // Buscar datos del usuario que matcheó
  const traveler = travelersByDest;
  const matched = Object.values(travelersByDest)
    .flat()
    .find((t) => t.id === targetId);

  if (matched) {
    setMatchedUserInfo({
      avatar: matched.avatar || "/images/default-avatar.png",
      name: matched.name || "Viajero",
    });
  }

  setShowMatchModal(true);
}

    } catch (error) {
      console.error(error);
    }
  };

  const normalizeCountry = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .replace(/[^a-zA-Z\s]/g, "") // remueve caracteres raros
    .trim()
    .toLowerCase();

    const manualCountryFix: Record<string, string> = {
  mexico: "MX",
  "estados unidos": "US",
  "republica dominicana": "DO",
  peru: "PE",
  panama: "PA",
};

const handleNextTraveler = () => {
  if (!selectedTraveler) return;

  // Encontrar en qué destino está el usuario actual
  const destinoId = Object.keys(travelersByDest).find((id) =>
    travelersByDest[id].some((t) => t.id === selectedTraveler.id)
  );

  if (!destinoId) return;

  const travelers = travelersByDest[destinoId];
  const index = travelers.findIndex((t) => t.id === selectedTraveler.id);

  if (index === -1) return;

  // Si hay un siguiente...
  if (index + 1 < travelers.length) {
    setSelectedTraveler(travelers[index + 1]);
  }
};
  

  // UI render
  if (loading)
    return (
      <p className="text-gray-500 text-center mt-4">Cargando viajeros...</p>
    );

  if (error) return <p className="text-red-500 text-center mt-4">⚠️ {error}</p>;

  if (destinos.length === 0)
    return (
      <p className="text-gray-400 text-center mt-4">
        No hay destinos disponibles
      </p>
    );

  return (
    <div className="relative p-6 space-y-10">
      <div className="w-full flex justify-center">
        <h1 className="relative text-xl md:text-2xl font-bold text-gray-800 mb-6 inline-block">
          Descubrir Match de viajes
          <span className="absolute left-0 bottom-1 w-full h-2 bg-yellow-400 -z-10"></span>
        </h1>
      </div>

      {destinos.map((destino) => {
        const travelers = travelersByDest[destino.id] || [];

        return (
          <div key={destino.id} className="relative">
            <div className="mb-4">
              <h2 className="text-md font-semibold">
                Destino:{" "}
                <span className="text-purple-800">{destino.name}</span>
              </h2>
            </div>

            {travelers.length > 1 && (
              <>
                <button
                  onClick={() => scroll(destino.id, "left")}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition"
                >
                  ←
                </button>
                <button
                  onClick={() => scroll(destino.id, "right")}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition"
                >
                  →
                </button>
              </>
            )}

            <div
              ref={(el) => {
                carouselRefs.current[destino.id] = el;
              }}
              className="flex gap-4 overflow-x-auto md:overflow-x-hidden flex-nowrap scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
            >
              {travelers.length ? (
                travelers.map((viajero) => (
                  <div
  key={viajero.id}
  onClick={() => setSelectedTraveler(viajero)}
  className="flex-shrink-0 w-72 md:w-64 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition duration-300 cursor-pointer snap-center bg-white"
>
  <div className="relative w-full h-72 md:h-56">
    <Image
      src={viajero.avatar || "/images/default-avatar.png"}
      alt={viajero.name || "Viajero"}
      fill
      className="object-cover"
    />

  </div>

  <div className="p-4 text-center bg-white">
    <div className="flex items-center justify-center gap-2">
  {viajero.country && (() => {
  const normalized = normalizeCountry(viajero.country);
  const manualCode = manualCountryFix[normalized];

  const code =
    manualCode ||
    getCode(viajero.country) ||
    getCode(normalized) ||
    null;

  return code ? (
    <Image
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={viajero.country}
      width={22}
      height={16}
      className="rounded-sm"
    />
  ) : null;
})()}


  <p className="text-base md:text-sm font-semibold text-gray-800">
    {viajero.name || "Viajero"}
  </p>
</div>

  </div>
</div>

                ))
              ) : (
                <p className="text-gray-500 text-sm col-span-full">
                  No hay viajeros que tengan este destino seleccionado.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {mounted &&
  createPortal(
    <AvatarModal
      isOpen={!!selectedTraveler}
      onClose={() => setSelectedTraveler(null)}
      userId={selectedTraveler?.id ?? ""}
      isMatchProfile={
        selectedTraveler ? !!matchedUsers[selectedTraveler.id] : false
      }
      likedUsers={likedUsers}
      onNextUser={handleNextTraveler}
      matchedUsers={matchedUsers}
      handleLike={handleLike}
    />,
    document.body
  )}



        {mounted &&
  showMatchModal &&
  createPortal(
    <MatchModal
      isOpen={showMatchModal}
      onClose={() => setShowMatchModal(false)}
      currentUserImg={currentUser?.avatar || "/images/default-avatar.png"}
      matchedUserImg={matchedUserInfo?.avatar || "/images/default-avatar.png"}
      matchedUserName={matchedUserInfo?.name || "Viajero"}
    />,
    document.body
  )}

    </div>
  );
}
