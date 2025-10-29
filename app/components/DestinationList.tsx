"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { DestinationDTO } from "@/app/types/destination";
import type { User } from "@/app/types/user";

interface DestinationsListProps {
  userDestino?: string;
}

export default function DestinationsList({
  userDestino,
}: DestinationsListProps) {
  const [destinos, setDestinos] = useState<DestinationDTO[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const calcDiscountedPrice = (
    listPrice?: number | null,
    discountPercent?: number | null
  ) => {
    if (!listPrice) return null;
    if (!discountPercent) return listPrice;
    return listPrice - (listPrice * discountPercent) / 100;
  };

  const isValidPrice = (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  };

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Fetch destinos
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

  useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo obtener el usuario");
      const { user } = await res.json();
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    }
  };
  fetchCurrentUser();
}, []);

  // Fetch usuarios
  useEffect(() => {
  if (!currentUser) return; // esperamos a tener el usuario

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`/api/users?excludeUserId=${currentUser.id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const { users } = await res.json();
      setUsuarios(users);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    }
  };

  fetchUsuarios();
}, [currentUser]);

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
    <div className="relative font-montserrat">
      {/* Flechas de scroll */}
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
        {destinos.map((destino) => {
          const usuariosConEseDestino = usuarios.filter(
            (u) =>
              Array.isArray(u.destino) &&
              u.destino.some(
                (d) => normalize(d).trim() === normalize(destino.name).trim()
              )
          );

          const hasUSDWithAirfare =
            destino.listUSDWithAirfare &&
            Number(destino.listUSDWithAirfare) > 0;
          const hasUSDWithoutAirfare =
            destino.listUSDWithoutAirfare &&
            Number(destino.listUSDWithoutAirfare) > 0;
          const hasCOPWithAirfare =
            destino.listCOPWithAirfare &&
            Number(destino.listCOPWithAirfare) > 0;
          const hasCOPWithoutAirfare =
            destino.listCOPWithoutAirfare &&
            Number(destino.listCOPWithoutAirfare) > 0;
          const hasBasePrice = destino.price && Number(destino.price) > 0;

          return (
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

                {/* 💵 Precios */}
                <div className="mt-4 space-y-2">
                  {/* USD con vuelo */}
                  {isValidPrice(destino.listUSDWithAirfare) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-montserrat">
                        USD con vuelo
                      </span>
                      <span className="text-right">
                        {isValidPrice(destino.discountUSDWithAirfarePercent) ? (
                          <>
                            <span className="line-through text-gray-400 text-sm mr-2">
                              $
                              {Number(
                                destino.listUSDWithAirfare
                              ).toLocaleString()}
                            </span>
                            <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                              $
                              {calcDiscountedPrice(
                                Number(destino.listUSDWithAirfare),
                                Number(destino.discountUSDWithAirfarePercent)
                              )?.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                            $
                            {Number(
                              destino.listUSDWithAirfare
                            ).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* USD sin vuelo */}
                  {isValidPrice(destino.listUSDWithoutAirfare) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-montserrat">
                        USD sin vuelo
                      </span>
                      <span className="text-right">
                        {isValidPrice(
                          destino.discountUSDWithoutAirfarePercent
                        ) ? (
                          <>
                            <span className="line-through text-gray-400 text-sm mr-2">
                              $
                              {Number(
                                destino.listUSDWithoutAirfare
                              ).toLocaleString()}
                            </span>
                            <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                              $
                              {calcDiscountedPrice(
                                Number(destino.listUSDWithoutAirfare),
                                Number(destino.discountUSDWithoutAirfarePercent)
                              )?.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                            $
                            {Number(
                              destino.listUSDWithoutAirfare
                            ).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* COP con vuelo */}
                  {isValidPrice(destino.listCOPWithAirfare) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-montserrat">
                        COP con vuelo
                      </span>
                      <span className="text-right">
                        {isValidPrice(destino.discountCOPWithAirfarePercent) ? (
                          <>
                            <span className="line-through text-gray-400 text-sm mr-2">
                              $
                              {Number(
                                destino.listCOPWithAirfare
                              ).toLocaleString("es-CO")}
                            </span>
                            <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                              $
                              {calcDiscountedPrice(
                                Number(destino.listCOPWithAirfare),
                                Number(destino.discountCOPWithAirfarePercent)
                              )?.toLocaleString("es-CO")}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                            $
                            {Number(destino.listCOPWithAirfare).toLocaleString(
                              "es-CO"
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* COP sin vuelo */}
                  {isValidPrice(destino.listCOPWithoutAirfare) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-montserrat">
                        COP sin vuelo
                      </span>
                      <span className="text-right">
                        {isValidPrice(
                          destino.discountCOPWithoutAirfarePercent
                        ) ? (
                          <>
                            <span className="line-through text-gray-400 text-sm mr-2">
                              $
                              {Number(
                                destino.listCOPWithoutAirfare
                              ).toLocaleString("es-CO")}
                            </span>
                            <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                              $
                              {calcDiscountedPrice(
                                Number(destino.listCOPWithoutAirfare),
                                Number(destino.discountCOPWithoutAirfarePercent)
                              )?.toLocaleString("es-CO")}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                            $
                            {Number(
                              destino.listCOPWithoutAirfare
                            ).toLocaleString("es-CO")}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Fallback: precio base solo si no hay ninguno de los anteriores */}
                  {!(
                    isValidPrice(destino.listUSDWithAirfare) ||
                    isValidPrice(destino.listUSDWithoutAirfare) ||
                    isValidPrice(destino.listCOPWithAirfare) ||
                    isValidPrice(destino.listCOPWithoutAirfare)
                  ) &&
                    isValidPrice(destino.price) && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm font-montserrat">
                          Precio base
                        </span>
                        <span className="text-right">
                          {isValidPrice(destino.discountPrice) ? (
                            <>
                              <span className="line-through text-gray-400 text-sm mr-2">
                                ${Number(destino.price).toLocaleString()}
                              </span>
                              <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                                $
                                {Number(destino.discountPrice).toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-white bg-primary px-2 py-1 rounded-lg">
                              ${Number(destino.price).toLocaleString()}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                  {/* Botón WhatsApp */}
                  <a
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white text-green-600 border border-green-500 px-4 py-1.5 rounded-lg hover:bg-green-50 transition text-sm mt-3"
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

                {/* Usuarios con preferencia */}
                {usuariosConEseDestino.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Prefieren este destino:
                    </p>
                    <div className="flex -space-x-3">
                      {usuariosConEseDestino.slice(0, 6).map((user) => (
                        <div
                          key={user.id}
                          className="relative group cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard-user/match-viajes`)
                          }
                        >
                          <Image
                            src={user.avatar || "/images/default-avatar.png"}
                            alt={user.name || "Usuario"}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded-full border-2 border-white shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                          />
                          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs font-medium py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            {user.name || "Usuario"}
                          </div>
                        </div>
                      ))}

                      {usuariosConEseDestino.length > 6 && (
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600 text-sm font-medium border-2 border-white shadow-sm">
                          +{usuariosConEseDestino.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
