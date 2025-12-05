"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Memberships from "./Memberships";
import UserPreferences from "./UserPreferences";
import { useSearchParams } from "next/navigation";
import InstallAppButton from "./InstallAppButton";
import { useChatStore } from "@/store/chatStore";
import { closeSocket } from "../utils/socket";

type Role = "ADMIN" | "SELLER" | "USER";

type Destination = string | string[] | null;
type Preference = string | string[] | null;

type UserShape = {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  avatar?: string | null;
  country?: string | null;
  destino?: Destination;
  preference?: Preference;
  verified?: boolean;
  clientProfile?: {
    subscriptionExpiresAt?: number;
    subscriptionPlan?: string;
    travelPoints?: number;
    travelPointsActive?: {
  id: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
}[];
  };
  vendedor?: {
    nombre: string;
    telefono?: string;
    avatar?: string | null;
    whatsappNumber?: string | null;
    currentlyLink?: string | null;
  } | null;
};

export default function UserProfile({ user }: { user: UserShape }) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = React.useState<string>(
    user.avatar ?? "/images/default-avatar.png"
  );
  const [loading, setLoading] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = React.useState(tabFromQuery ?? "destinos");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [nextDestination, setNextDestination] = React.useState<null | {
    id: string;
    name: string;
    country: string;
    city?: string;
    imageUrl?: string | null;
    description?: string | null;
    categories?: { id: string; name: string }[];
    tripDates?: string[];
  }>(null);

  // Obtenemos la acción resetChat del store
  const resetChat = useChatStore((state) => state.resetChat);

  async function handleSave(data: { gustos: string[]; destinos: string[] }) {
    const formData = new FormData();
    data.gustos.forEach((g) => formData.append("preference", g));
    data.destinos.forEach((d) => formData.append("destino", d));

    const res = await fetch("/api/user/preferences", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || "Error al guardar preferencias");
    }
  }

  React.useEffect(() => {
    async function fetchReservation() {
      try {
        const res = await fetch("/api/reservations", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al obtener reserva");

        const data = await res.json();

        if (data.reservations?.length > 0) {
          const firstReservation = data.reservations[0];
          const dest = firstReservation.destination;

          if (dest) {
            setNextDestination({
              id: dest.id,
              name: dest.name,
              country: dest.country,
              city: dest.city,
              imageUrl: dest.imageUrl,
              description: dest.description,
              // ✅ Nuevos campos del destino
              categories: dest.categories || [],
              tripDates: dest.tripDates || [],
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar reservas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoading(true);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al subir avatar");
      const data = await res.json();
      setAvatarPreview(data.user.avatar);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Limpiamos el estado de Zustand (Borra los chats)
    resetChat();

    // Cerramos la conexión de Socket (Detiene listeners y eventos)
    closeSocket();

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error(
        "Error al llamar a la API de logout, continuando con la recarga:",
        error
      );
    }
    // 🚨 4. FORZAMOS UNA RECARGA COMPLETA
    // Esto asegura que todo el código del cliente (incluyendo el módulo singleton del socket)
    // se re-ejecute y se cargue desde cero en la página de login.
    window.location.replace("/login");
  };

  const destinos: string[] = React.useMemo(() => {
    if (!user.destino) return [];
    if (typeof user.destino === "string")
      return user.destino.split(",").map((d) => d.trim());
    if (Array.isArray(user.destino))
      return user.destino.map((d) => String(d).trim());
    return [];
  }, [user.destino]);

  const gustos =
    typeof user.preference === "string"
      ? user.preference.split(",").map((p) => p.trim())
      : user.preference || [];

  const expiresAt = user.clientProfile?.subscriptionExpiresAt
    ? new Date(user.clientProfile.subscriptionExpiresAt)
    : null;

  const NOW = new Date();

  let daysLeft = null;

  function getDaysLeft(expiresAt: string) {
  const now = new Date();
  const exp = new Date(expiresAt);

  const diff = exp.getTime() - now.getTime();
  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


  if (expiresAt) {
    const diff = expiresAt.getTime() - NOW.getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24)); // días restantes redondeados hacia arriba
  }

  return (
    <div className="font-montserrat w-full max-w-5xl mx-auto px-4 md:px-6 pb-16">
      {/* HEADER */}
      <div className="relative bg-white md:shadow-md md:border md:border-gray-200 p-6 rounded-2xl flex flex-col items-center text-center md:grid md:grid-cols-[auto_1fr_auto] md:text-left md:items-center gap-6 overflow-visible">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
          >
            <Image
              src="/favicon/perfiluser-club-solteros.svg"
              alt="menu"
              width={20}
              height={20}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 bg-white shadow-md rounded-lg w-40 overflow-hidden z-20"
              >
                <button
                  onClick={() =>
                    router.push(`/dashboard-user/config/${user.id}`)
                  }
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-montserrat"
                >
                  Ver perfil
                </button>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-montserrat"
                >
                  Cerrar sesión
                </button>
                <InstallAppButton />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        {/* Avatar Desktop */}
        <div className="hidden md:flex flex-col items-center md:col-span-1 relative">
          <div className="relative w-48 h-48 rounded-full border-4 border-primary overflow-visible">
            <Image
              src={avatarPreview}
              alt={user.name ?? "User profile"}
              className="w-full h-full object-cover rounded-full"
              width={192}
              height={192}
            />
            {user.verified && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
                <Image
                  src="/favicon/check-aprobacion-club-solteros.svg"
                  alt="Verificado"
                  width={36}
                  height={36}
                />
              </div>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="mt-3 text-sm text-white bg-primary hover:bg-purple-700 px-4 py-2 rounded-md cursor-pointer font-montserrat"
          >
            {loading ? "Subiendo..." : "Cambiar Imagen"}
          </label>
        </div>

        {/* Avatar Mobile */}
        <div className="flex md:hidden flex-col items-center relative">
          <div className="relative w-48 h-48 rounded-full border-4 border-purple-500 overflow-visible cursor-pointer">
            <Image
              src={avatarPreview}
              alt={user.name ?? "User profile"}
              className="w-full h-full object-cover rounded-full"
              width={192}
              height={192}
              onClick={() => setIsAvatarModalOpen(true)}
            />
            {user.verified && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
                <Image
                  src="/favicon/check-aprobacion-club-solteros.svg"
                  alt="Verificado"
                  width={36}
                  height={36}
                />
              </div>
            )}
          </div>
        </div>

        {/* Input compartido */}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Modal para mobile */}
        <AnimatePresence>
          {isAvatarModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center md:hidden"
              onClick={() => setIsAvatarModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="bg-white rounded-2xl w-[90%] max-w-sm h-[80%] relative flex flex-col items-center overflow-hidden"
                onClick={(e) => e.stopPropagation()} // evitar cierre al click dentro
              >
                <Image
                  src={avatarPreview}
                  alt={user.name ?? "User profile"}
                  className="w-full h-full object-cover"
                  fill
                />

                {/* Overlay info arriba izquierda */}
                <div className="absolute text-left top-4 left-4 text-white font-montserrat flex flex-col items-start space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{user.name}</h2>
                    {user.verified && (
                      <Image
                        src="/favicon/check-aprobacion-club-solteros.svg"
                        alt="Verificado"
                        width={20}
                        height={20}
                      />
                    )}
                  </div>

                  {/* País */}
                  {user.country && (
                    <p className="inline-block text-sm font-montserrat bg-white/90 text-black px-3 py-1 rounded-full shadow-sm">
                      {user.country}
                    </p>
                  )}

                  {/* Gustos */}
                  {gustos.length > 0 ? (
                    <ul className="flex flex-wrap gap-1 font-montserrat justify-start">
                      {gustos.map((g, i) => {
                        const icons: string[] = [];
                        if (g.toLowerCase() === "playa")
                          icons.push("/favicon/playa-club-solteros.svg");
                        if (g.toLowerCase() === "aventura")
                          icons.push("/favicon/aventura-club-solteros.svg");
                        if (g.toLowerCase() === "cultura")
                          icons.push("/favicon/cultura-club-solteros.svg");
                        if (g.toLowerCase() === "mixto")
                          icons.push(
                            "/favicon/playa-club-solteros.svg",
                            "/favicon/aventura-club-solteros.svg",
                            "/favicon/cultura-club-solteros.svg"
                          );

                        return (
                          <li key={i} className="flex items-center gap-0.5">
                            {icons.map((icon, idx) => (
                              <Image
                                key={idx}
                                src={icon}
                                alt={g}
                                width={26}
                                height={26}
                                className="object-contain"
                              />
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm font-montserrat">
                      No especificado
                    </p>
                  )}
                </div>

                {/* Botón cambiar foto abajo */}
                <div className="absolute bottom-4 w-full flex justify-center">
                  <label
                    htmlFor="avatar-upload"
                    className={`flex items-center justify-center w-14 h-14 bg-white rounded-full cursor-pointer transition`}
                  >
                    {loading ? (
                      <span className="text-white text-lg font-bold">...</span>
                    ) : (
                      <Image
                        src="/favicon/camara-subir-fotos-club-solteros.svg"
                        alt="Cambiar avatar"
                        width={100}
                        height={100}
                      />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Botón cerrar */}
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="absolute top-2 right-2 text-white text-2xl font-bold"
                >
                  ✕
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Centro */}
        <div className="flex flex-col items-center justify-center md:items-start md:justify-start md:col-span-1 mt-4 md:mt-0">
          <h1 className="text-3xl font-bold text-black font-montserrat">
            Hola {user.name ?? "Viajero"}
          </h1>
          {/* BADGE DE ROL + PLAN + TRAVEL POINTS */}
          <div className="flex items-center gap-2 mt-2 font-montserrat">
            {/* Subscription Plan del Client */}
            {user.clientProfile?.subscriptionPlan && (
              <div className="flex items-center gap-2 mt-2 font-montserrat">
                {user.clientProfile?.subscriptionPlan && (
                  <div className="relative flex flex-col items-center group">
                    {/* Badge */}
                    <span className="text-sm font-montserrat font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-md cursor-default">
                      {user.clientProfile.subscriptionPlan}
                    </span>

                    {/* Tooltip (solo visible en hover) */}
                    <div
                      className="
        absolute top-full mt-2 w-max px-3 py-2 text-xs rounded-md shadow-md bg-gray-800 text-white 
        opacity-0 pointer-events-none transition-opacity duration-200
        group-hover:opacity-100
      "
                    >
                      {user.clientProfile.subscriptionPlan === "STANDARD"
                        ? "Sin suscripción activa"
                        : daysLeft === null
                        ? "Sin fecha"
                        : daysLeft > 0
                        ? `Le quedan ${daysLeft} día${
                            daysLeft === 1 ? "" : "s"
                          }`
                        : "La suscripción ha expirado"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {typeof user.clientProfile?.travelPoints === "number" && (
              <div className="relative flex flex-col items-center group">
                {/* Badge */}
                <span className="flex font-montserrat items-center gap-1 text-sm font-semibold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md cursor-default">
                  <Image
                    src="/favicon/iconosclub-25.svg"
                    alt="Travel Points"
                    width={18}
                    height={18}
                  />
                  {user.clientProfile.travelPoints}
                </span>

                {/* Tooltip */}
                <div
                  className="
        absolute top-full mt-2 w-max px-3 py-2 text-xs rounded-md shadow-md bg-gray-800 text-white 
        opacity-0 pointer-events-none transition-opacity duration-200
        group-hover:opacity-100
      "
                >
                 {!user.clientProfile?.travelPointsActive ||
user.clientProfile.travelPointsActive.length === 0 ? (
  "No hay puntos activos"
) : (
  <div className="flex flex-col gap-1">
    {user.clientProfile.travelPointsActive.map((tp) => {
      const daysLeft = getDaysLeft(tp.expiresAt);

      return (
        <div key={tp.id}>
          +{tp.amount} pts —{" "}
          {daysLeft > 0
            ? `${daysLeft} día${daysLeft === 1 ? "" : "s"} restantes`
            : "Vencidos"}
        </div>
      );
    })}
  </div>
)}

                </div>
              </div>
            )}
          </div>

          <UserPreferences
            gustosIniciales={gustos}
            destinosIniciales={destinos}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* VENDEDOR */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4 font-montserrat">
          Tu Vendedor/a asignado/a
        </h2>
        {user.vendedor ? (
          <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <Image
                src={user.vendedor.avatar || "/images/default-avatar.png"}
                alt={user.vendedor.nombre}
                fill
                className="rounded-full object-cover border-2 border-gray-200"
              />
            </div>
            <p className="text-gray-700 font-semibold text-lg text-center font-montserrat">
              {user.vendedor.nombre}
            </p>
            <div className="flex gap-3">
              {user.vendedor.whatsappNumber && (
                <a
                  href={user.vendedor.whatsappNumber}
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
              )}
              {user.vendedor.currentlyLink && (
                <a
                  href={user.vendedor.currentlyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-500 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition text-sm font-montserrat"
                >
                  <Image
                    src="/favicon/calendly.svg"
                    alt="Calendly"
                    width={16}
                    height={16}
                  />
                  Calendly
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500 font-montserrat">
            <p>No tienes un vendedor asignado</p>
            <Image
              src="/favicon/finuser-28.svg"
              alt="Calendly"
              width={170}
              height={170}
              className="mx-auto mt-3"
            />
          </div>
        )}
      </div>
      <Memberships />
    </div>
  );
}
