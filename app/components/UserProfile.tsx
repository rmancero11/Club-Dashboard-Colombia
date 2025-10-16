"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DestinationsList from "./DestinationList";
import Memberships from "./Memberships";
import DestinationCard from "./DestinationCard";

type Role = "ADMIN" | "SELLER" | "USER";

type UserShape = {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  avatar?: string | null;
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

  return (
    <div  className="font-montserrat w-full max-w-5xl mx-auto px-4 md:px-6">
      {/*{/* Header principal */}
<div className="bg-white shadow-md p-6 rounded-2xl grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-6">
  {/* Avatar */}
 {/* Avatar */}
<div className="flex justify-center md:justify-start">
  <div className="flex flex-col items-center">
    <Image
      src={avatarPreview}
      alt={user.name ?? "User profile"}
      className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
      width={128}
      height={128}
    />
    <label
      htmlFor="avatar-upload"
      className="font-montserrat mt-3 text-sm text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md cursor-pointer"
    >
      {loading ? "Subiendo..." : "Cambiar foto"}
    </label>
    <input
      id="avatar-upload"
      type="file"
      accept="image/*"
      onChange={handleAvatarChange}
      className="hidden"
    />
  </div>
</div>


  {/* Texto centrado */}
  <div className="flex flex-col items-center justify-center text-center">
    <h1 className="font-montserrat text-2xl font-bold text-black">
      Hola, {user.name ?? "Viajero"}
    </h1>

    <span className="font-montserrat mt-2 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
      {user.role === "USER"
        ? "Viajero principiante"
        : user.role === "SELLER"
        ? "Vendedor"
        : "Administrador"}
    </span>
  </div>

  {/* Botones */}
  <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-end mt-4 md:mt-0">
    <button
      onClick={() => router.push(`/dashboard-user/config/${user.id}`)}
      className="font-montserrat w-full sm:w-auto rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Ver perfil
    </button>
    <button
      onClick={logout}
      className="font-montserrat w-full sm:w-auto rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Cerrar sesión
    </button>
  
</div>

</div>


      <div className="mt-8 flex flex-col md:flex-row gap-24">
        {/* Vendedor asignado */}
        <div className="flex-1 max-w-sm">
          <h2 className="font-montserrat text-xl font-bold mb-4">Vendedor/a asignado/a</h2>
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
              <p className="font-montserrat text-gray-700 font-semibold text-lg text-center">
                {user.vendedor.nombre}
              </p>
              <div className="flex flex-col gap-2 items-center w-full">
                {user.vendedor.whatsappNumber && (
                  <a
                    href={user.vendedor.whatsappNumber}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-montserrat flex items-center justify-center gap-2 bg-white text-green-600 border border-green-500 px-4 py-1.5 rounded-lg hover:bg-green-50 transition text-sm min-w-[120px]"
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
                    className="font-montserrat flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-500 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition text-sm min-w-[120px]"
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
            <div className="font-montserrat bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
              <p>No tienes un vendedor asignado</p>
            </div>
          )}
        </div>

        {/* Próximo destino */}
        <div className="flex-1 max-w-sm">
          <h2 className="font-montserrat text-xl font-bold mb-4">Tu próximo destino</h2>
          {nextDestination ? (
            <DestinationCard destino={nextDestination} />
          ) : (
            <p className="font-montserrat text-gray-500 text-center">
              Todavía no has reservado un destino.
            </p>
          )}
        </div>
      </div>

      {/* Destinos recomendados */}
      <div className="mt-8">
        <h2 className="font-montserrat text-xl font-bold mb-4">Destinos recomendados</h2>
        <DestinationsList />
      </div>

      {/* Sección de membresías */}
      <Memberships />
    </div>
  );
}
