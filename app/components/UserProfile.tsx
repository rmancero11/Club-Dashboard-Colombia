"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import DestinationsList from "./DestinationList";
import Memberships from "./Memberships";
import DestinationCard from "./DestinationCard";

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
  const [activeTab, setActiveTab] = React.useState("destinos");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [nextDestination, setNextDestination] = React.useState<{
    id: string;
    name: string;
    country: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null>(null);

  React.useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch("/api/reservations");
        if (!res.ok) throw new Error("No se pudieron cargar las reservas");
        const data = await res.json();
        setNextDestination(data.nextDestination ?? null);
      } catch (err) {
        console.error(err);
      }
    };
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
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  };

  const destinos =
    typeof user.destino === "string"
      ? user.destino.split(",").map((d) => d.trim())
      : user.destino || [];

  const gustos =
    typeof user.preference === "string"
      ? user.preference.split(",").map((p) => p.trim())
      : user.preference || [];

  return (
    <div className="font-montserrat w-full max-w-5xl mx-auto px-4 md:px-6 pb-16">
      {/* HEADER */}
      <div className="relative bg-white shadow-md p-6 rounded-2xl flex flex-col items-center text-center md:grid md:grid-cols-[auto_1fr_auto] md:text-left md:items-center gap-6">
        {/* Dropdown arriba derecha */}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
{/* Desktop */}
<div className="hidden md:flex flex-col items-center md:col-span-1">
  <Image
    src={avatarPreview}
    alt={user.name ?? "User profile"}
    className="w-48 h-48 rounded-full border-4 border-purple-500 object-cover"
    width={144}
    height={144}
  />
  <label
    htmlFor="avatar-upload"
    className="mt-3 text-sm text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md cursor-pointer font-montserrat"
  >
    {loading ? "Subiendo..." : "Cambiar foto"}
  </label>
</div>

{/* Mobile */}
<div className="flex md:hidden flex-col items-center md:col-span-1 relative">
  <Image
    src={avatarPreview}
    alt={user.name ?? "User profile"}
    className="w-48 h-48 rounded-full border-4 border-purple-500 object-cover cursor-pointer"
    width={144}
    height={144}
    onClick={() => setIsAvatarModalOpen(true)}
  />
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
        <div className="absolute top-4 left-4 text-white font-montserrat space-y-1">
          <h2 className="text-lg font-semibold">{user.name}</h2>
          {gustos.length > 0 ? (
    <ul className="flex flex-wrap gap-3 font-montserrat">
      {gustos.map((g, i) => {
        // Determinar los iconos según el gusto
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
          <li key={i} className="flex items-center gap-1">
            {icons.map((icon, idx) => (
              <Image
                key={idx}
                src={icon}
                alt={g}
                width={20}
                height={20}
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
          {user.country && <p>{user.country}</p>}
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
          <span className="mt-2 text-sm font-medium bg-purple-100 text-purple-700 px-3 py-1 rounded-md font-montserrat">
            {user.role === "USER"
              ? "Viajero Principiante"
              : user.role === "SELLER"
              ? "Vendedor"
              : "Administrador"}
          </span>

{/* Destinos de interés */}
<div className="mt-5 w-full text-left">
  <h2 className="text-base font-semibold text-gray-800 mb-2 font-montserrat">
    Destinos de interés
  </h2>
  {destinos.length > 0 ? (
    <ul
      className={`grid gap-3 text-sm text-gray-600 font-montserrat ${
        destinos.length === 1
          ? "grid-cols-1 sm:grid-cols-1 justify-start" // un solo destino, alineado a la izquierda
          : "grid-cols-1 sm:grid-cols-2" // 2 columnas en escritorio, 1 en mobile
      }`}
    >
      {destinos.map((d, i) => (
        <li
          key={i}
          className="bg-gray-100 rounded-xl py-2 px-3 text-left max-w-fit"
        >
          {d}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500 text-sm font-montserrat">
      No especificado
    </p>
  )}
</div>




          {/* Tus gustos */}
<div className="mt-6 w-full text-left">
  <h2 className="text-base font-semibold text-gray-800 mb-2 font-montserrat">
    Tus gustos
  </h2>
  {gustos.length > 0 ? (
    <ul className="flex flex-wrap gap-3 font-montserrat">
      {gustos.map((g, i) => {
        // Determinar los iconos según el gusto
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
          <li key={i} className="flex items-center gap-2">
            {icons.map((icon, idx) => (
              <Image
                key={idx}
                src={icon}
                alt={g}
                width={50}
                height={50}
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
          </div>
        )}
      </div>

      {/* TABS INFERIORES */}
      <div className="mt-10">
        <ul className="flex justify-around border-b">
          {[
            { key: "destinos", label: "Tus Destinos" },
            { key: "membresias", label: "Membresías" },
            { key: "descubrir", label: "Descubrir" },
          ].map((tab) => (
            <li
              key={tab.key}
              className={`py-2 font-medium text-sm transition relative font-montserrat cursor-pointer ${
                activeTab === tab.key
                  ? "text-yellow-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"
                />
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {activeTab === "destinos" && (
            <>
              <h2 className="text-xl font-bold mb-4 font-montserrat">
                Tu próximo destino
              </h2>
              {nextDestination ? (
                <DestinationCard destino={nextDestination} />
              ) : (
                <p className="text-gray-500 text-center font-montserrat">
                  Todavía no has reservado un destino.
                </p>
              )}
            </>
          )}

          {activeTab === "membresias" && <Memberships />}
          {activeTab === "descubrir" && <DestinationsList />}
        </div>
      </div>
    </div>
  );
}
