"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPortal } from "react-dom";
import AvatarModal from "@/app/components/AvatarModal";
import type { DestinationDTO } from "@/app/types/destination";
import type { TravelerDTO } from "@/app/types/destination";
import type { User } from "@/app/types/user";

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

  // 🧠 Cargar destinos y sus viajeros
  useEffect(() => {
    if (!currentUser) return; // Esperamos a tener usuario

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/destination", { cache: "no-store" });
        if (!res.ok) throw new Error("Error al cargar destinos");
        const { items } = await res.json();

        setDestinos(items);

       // 🔎 Normalizar texto para hacer coincidencias aproximadas
const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

const travelersData: Record<string, TravelerDTO[]> = {};

for (const dest of items) {
  const userRes = await fetch(`/api/users?excludeUserId=${currentUser.id}`, {
    cache: "no-store",
  });

  if (!userRes.ok) {
    travelersData[dest.id] = [];
    continue;
  }

  const { users } = await userRes.json();

  // 📍 Filtramos los viajeros que coinciden con el destino (match aproximado)
  const normalizedDest = normalizeText(dest.name);
  const matchingTravelers = users.filter((trav: TravelerDTO) =>
    trav.destino.some((d) => {
      const nd = normalizeText(d);
      // Coincide si comparten palabras clave
      return (
        nd.includes("cancun") && normalizedDest.includes("cancun") ||
        nd.includes("temptation") && normalizedDest.includes("temptation") ||
        nd.split(" ").some((word) => normalizedDest.includes(word))
      );
    })
  );

  travelersData[dest.id] = matchingTravelers;
}

setTravelersByDest(travelersData);


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
      {/* 🔙 Botón Volver */}
      <button
        onClick={() => router.push("/dashboard-user")}
        className="absolute top-4 left-4 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition text-sm font-medium shadow-sm"
      >
        ← Volver
      </button>

      {/* Título principal */}
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
                Destino: <span className="text-purple-800">{destino.name}</span>
              </h2>
            </div>

            {/* Flechas de scroll */}
            {travelers.length > 1 && (
              <>
                <button
                  onClick={() => scroll(destino.id, "left")}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => scroll(destino.id, "right")}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition"
                >
                  &#8594;
                </button>
              </>
            )}

            {/* Carrusel */}
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
                    className="flex-shrink-0 w-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition duration-300 cursor-pointer snap-center bg-white"
                  >
                    <div className="relative w-full h-56">
                      <Image
                        src={viajero.avatar || "/images/default-avatar.png"}
                        alt={viajero.name || "Viajero"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-3 right-3 text-white rounded-full p-1.5 shadow">
                        <Image
                          src="/favicon/iconosclub-21.svg"
                          alt="Ícono"
                          width={30}
                          height={30}
                        />
                      </div>
                    </div>
                    <div className="p-3 text-center bg-white">
                      <p className="text-sm font-semibold text-gray-800">
                        {viajero.name || "Viajero"}
                      </p>
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

      {/* Modal de Avatar */}
      {mounted &&
        selectedTraveler &&
        createPortal(
          <AvatarModal
            isOpen={!!selectedTraveler}
            onClose={() => setSelectedTraveler(null)}
            avatar={selectedTraveler.avatar || "/images/default-avatar.png"}
            name={selectedTraveler.name}
            country={selectedTraveler.country}
            preferences={selectedTraveler.preference}
            destino={selectedTraveler.destino}
          />,
          document.body
        )}
    </div>
  );
}
