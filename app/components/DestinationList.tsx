"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { DestinationDTO } from "@/app/types/destination";

interface DestinationsListProps {
  userDestino?: string;
}

export default function DestinationsList({
  userDestino,
}: DestinationsListProps) {
  const [destinos, setDestinos] = useState<DestinationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // ✅ para redireccionar

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  useEffect(() => {
    const fetchDestinos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/destination", { cache: "no-store" });
        if (!res.ok) throw new Error("Error al cargar destinos");

        const { items } = await res.json();
        let sorted: DestinationDTO[] = items;

        if (userDestino) {
          sorted = sorted.sort((a, b) => {
            const aMatch = normalize(a.name).includes(normalize(userDestino));
            const bMatch = normalize(b.name).includes(normalize(userDestino));
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
        }

        setDestinos(sorted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchDestinos();
  }, [userDestino]);

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.clientWidth;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -width / 2 : width / 2,
      behavior: "smooth",
    });
  };

  if (loading)
    return (
      <p className="text-gray-500 text-center mt-4">Cargando destinos...</p>
    );
  if (error) return <p className="text-red-500 text-center mt-4">⚠️ {error}</p>;
  if (destinos.length === 0)
    return (
      <p className="text-gray-400 text-center mt-4">
        No hay destinos disponibles
      </p>
    );

  return (
    <div className="relative">
      {/* Flechas de scroll en desktop */}
      <button
        onClick={() => scroll("left")}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg p-2 rounded-full hover:bg-gray-100 transition"
      >
        &#8592;
      </button>
      <button
        onClick={() => scroll("right")}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg p-2 rounded-full hover:bg-gray-100 transition"
      >
        &#8594;
      </button>

      {/* Carrusel */}
      <div
        ref={carouselRef}
        className="flex gap-6 p-4 overflow-x-auto touch-pan-x scrollbar-hidden"
      >
        {destinos.map((destino) => (
          <div
            key={destino.id}
            className="flex-shrink-0 w-72 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
          >
            <div className="relative w-full h-48">
              <Image
                src={destino.imageUrl || "/images/placeholder.jpg"}
                alt={destino.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {destino.name}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {destino.city
                  ? `${destino.city}, ${destino.country}`
                  : destino.country}
              </p>

              {destino.description && (
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {destino.description}
                </p>
              )}

              {destino.category && (
                <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                  {destino.category}
                </span>
              )}

              {/* Precios */}
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {destino.discountPrice ? (
                  <>
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-md line-through">
                      ${Number(destino.price).toLocaleString()}
                    </span>
                    <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-md">
                      ${Number(destino.discountPrice).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-md">
                    ${Number(destino.price).toLocaleString()}
                  </span>
                )}
                <a
                  href=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-green-600 border border-green-500 px-4 py-1.5 rounded-lg hover:bg-green-50 transition text-sm font-montserrat"
                >
                  <Image
                    src="/favicon/whatsapp.svg"
                    alt="WhatsApp"
                    width={16}
                    height={16}
                  />
                  WhatsApp
                </a>
              </div>

              {/* Viajeros */}
              {destino.travelers && destino.travelers.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Viajan:
                  </p>
                  <div className="flex -space-x-3">
                    {destino.travelers.slice(0, 6).map((viajero) => (
                      <div
                        key={viajero.id}
                        className="relative group cursor-pointer"
                        onClick={() =>
                          router.push("/dashboard-user/match-viajes")
                        } // ✅ redirige al componente nuevo
                      >
                        <Image
                          src={viajero.avatar || "/images/default-avatar.png"}
                          alt={viajero.name || "Viajero"}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded-full border-2 border-white shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                        />
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs font-medium py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          {viajero.name || "Viajero"}
                        </div>
                      </div>
                    ))}

                    {destino.travelers.length > 6 && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600 text-sm font-medium border-2 border-white shadow-sm">
                        +{destino.travelers.length - 6}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
