"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { DestinationDTO } from "@/app/types/destination";
import AvatarModal from "@/app/components/AvatarModal";
import { createPortal } from "react-dom";

export default function TravelersMatchList() {
  const router = useRouter();
  const [destinos, setDestinos] = useState<DestinationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedTraveler, setSelectedTraveler] = useState<{
  id: string;
  name?: string | null;
  avatar: string;
  country?: string | null;
  preferences?: string[];
} | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Cargar destinos y ordenarlos por cantidad de viajeros
  useEffect(() => {
    const fetchDestinos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/destination", { cache: "no-store" });
        if (!res.ok) throw new Error("Error al cargar destinos");
        const { items } = await res.json();
const normalizedItems = items.map((d: DestinationDTO) => ({
  ...d,
  travelers: (d.travelers || []).map((t: any) => {
    const prefs =
      Array.isArray(t.preferences)
        ? t.preferences
        : typeof t.preference === "string"
        ? t.preference.split(",").map((p: string) => p.trim())
        : [];
    return { ...t, preferences: prefs };
  }),
}))

setDestinos(normalizedItems);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchDestinos();
  }, []);

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
        No hay viajeros disponibles
      </p>
    );

  return (
    <div className="relative p-6 space-y-10">
      {/* 🔙 Botón Volver */}
      <button
        onClick={() => router.push("/dashboard-user")}
        className="absolute top-4 left-4 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition text-sm font-medium shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Volver
      </button>

      {/* Título centrado con subrayado amarillo */}
      <div className="w-full flex justify-center">
        <h1 className="relative text-xl md:text-2xl font-bold text-gray-800 mb-6 inline-block">
          Descubrir Match de viajes
          <span className="absolute left-0 bottom-1 w-full h-2 bg-yellow-400 -z-10"></span>
        </h1>
      </div>

      {destinos.map((destino) => (
        <div key={destino.id} className="relative">
          {/* Título del destino */}
          <div className="mb-4">
            <h2 className="text-md font-semibold">
              Destino: <span className="text-purple-800">{destino.name}</span>
            </h2>
          </div>

          {/* Flechas de scroll solo si hay más de un viajero */}
          {destino.travelers && destino.travelers.length > 1 && (
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

          {/* Carrusel horizontal mobile y desktop */}
          <div
            ref={(el) => {
              carouselRefs.current[destino.id] = el;
            }}
            className="
              flex gap-4
              overflow-x-auto md:overflow-x-hidden
              flex-nowrap md:flex-nowrap
              scroll-smooth snap-x snap-mandatory
              scrollbar-hide
              pb-2
            "
          >
            {destino.travelers?.length ? (
              destino.travelers.map((viajero) => (
                <div
                  key={viajero.id}
                  onClick={() =>
  setSelectedTraveler({
    id: viajero.id,
    name: viajero.name,
    avatar: viajero.avatar || "/images/default-avatar.png",
    country: viajero.country,
    preferences: Array.isArray((viajero as any).preferences)
      ? (viajero as any).preferences
      : typeof (viajero as any).preference === "string"
      ? (viajero as any).preference.split(",").map((p: string) => p.trim())
      : [],
  })
}


                  className="
                    flex-shrink-0 w-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg
                    transition duration-300 cursor-pointer snap-center bg-white
                  "
                >
                  <div className="relative w-full h-56">
                    <Image
                      src={viajero.avatar || "/images/default-avatar.png"}
                      alt={viajero.name || "Viajero"}
                      fill
                      className="object-cover"
                    />
                    {/* Ícono de match sobre la imagen */}
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
                No hay viajeros anotados para este destino.
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Modal de Avatar */}
      {mounted &&
        selectedTraveler &&
        createPortal(
          <AvatarModal
  isOpen={!!selectedTraveler}
  onClose={() => setSelectedTraveler(null)}
  avatar={selectedTraveler.avatar}
  name={selectedTraveler.name}
  country={selectedTraveler.country}
  preferences={selectedTraveler.preferences}
/>,
          document.body
        )}
    </div>
  );
}
