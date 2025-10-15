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
  phone?: string | null;
  country?: string | null;
  destino?: string | null;
  createdAt?: string | Date | null;
  avatar?: string | null;
  businessId?: string | null;
  clientProfileId?: string | null;
  vendedor?: {
    nombre: string;
    telefono?: string;
    avatar?: string | null;
    whatsappNumber?: string | null;
    currentlyLink?: string | null;
  } | null;

  // Archivos
  purchaseOrder?: string | null;
  flightTickets?: string | null;
  serviceVoucher?: string | null;
  medicalAssistanceCard?: string | null;
  travelTips?: string | null;
};

function formatDate(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function UserProfile({ user }: { user: UserShape }) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = React.useState<string>(
    user.avatar ?? "/images/default-avatar.png"
  );
  const [loading, setLoading] = React.useState(false);
  const [showFiles, setShowFiles] = React.useState(false);

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

  const fileList: { label: string; url?: string | null }[] = [
    { label: "Orden de compra", url: user.purchaseOrder },
    { label: "Boletos de vuelo", url: user.flightTickets },
    { label: "Voucher de servicio", url: user.serviceVoucher },
    { label: "Tarjeta de asistencia médica", url: user.medicalAssistanceCard },
    { label: "Tips de viaje", url: user.travelTips },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 font-roboto">
      {/* Header principal */}
      <div className="bg-white shadow-md p-6 flex flex-col items-center md:flex-row md:items-start gap-6 rounded-2xl">
        {/* Avatar con upload */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <Image
            src={avatarPreview}
            alt={user.name ?? "User profile"}
            className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
            width={128}
            height={128}
          />
          <label
            htmlFor="avatar-upload"
            className="mt-3 text-sm text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md cursor-pointer"
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

        {/* Información principal */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {user.name ?? "Sin nombre"}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-1 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                {user.role}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/dashboard-user/config/${user.id}`)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Ver perfil
              </button>
              <button
                onClick={logout}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Detalles del usuario simplificados */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-800">
                {user.phone ?? "No especificado"}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">País</p>
              <p className="font-medium text-gray-800">
                {user.country ?? "No especificado"}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Destino de interés</p>
              <p className="font-medium text-gray-800">
                {user.destino ?? "No especificado"}
              </p>
            </div>
          </div>

          {/* Archivos subidos */}
          <div className="mt-6">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="w-full text-left px-4 py-2 bg-purple-100 text-purple-800 font-medium rounded-md hover:bg-purple-200"
            >
              {showFiles ? "Ocultar archivos" : "Ver archivos subidos"}
            </button>
            {showFiles && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {fileList.map((file) => (
                  <div
                    key={file.label}
                    className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {file.label}
                    </span>
                    {file.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No subido</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-24">
        {/* Vendedor asignado */}
        <div className="flex-1 max-w-sm">
          <h2 className="text-xl font-bold mb-4">Vendedor/a asignado/a</h2>
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
              <p className="text-gray-700 font-semibold text-lg text-center">
                {user.vendedor.nombre}
              </p>
              <div className="flex flex-col gap-2 items-center w-full">
                {user.vendedor.whatsappNumber && (
                  <a
                    href={user.vendedor.whatsappNumber}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white text-green-600 border border-green-500 px-4 py-1.5 rounded-lg hover:bg-green-50 transition text-sm min-w-[120px]"
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
                    className="flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-500 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition text-sm min-w-[120px]"
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
            <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
              <p>No tienes un vendedor asignado</p>
            </div>
          )}
        </div>

        {/* Próximo destino */}
        <div className="flex-1 max-w-sm">
          
         
  <h2 className="text-xl font-bold mb-4">Tu próximo destino</h2>
  {nextDestination ? (
    <DestinationCard destino={nextDestination} />
  ) : (
    <p className="text-gray-500 text-center">
      Todavía no has reservado un destino.
    </p>
  )}
</div>
          
       
      </div>

      {/* Destinos recomendados */}
      <div className="mt-8 ">
        <h2 className="text-xl font-bold mb-4">Destinos recomendados</h2>
        <DestinationsList userDestino={user.destino ?? undefined} />
      </div>

      {/* Sección de membresías */}
      <Memberships />
    </div>
  );
}
