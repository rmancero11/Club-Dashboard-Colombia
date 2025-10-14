'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DestinationsList from './DestinationList';

type Role = 'ADMIN' | 'SELLER' | 'USER';

type UserShape = {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  phone?: string | null;
  country?: string | null;
  budget?: string | null;
  preference?: string | null;
  destino?: string | null;
  comment?: string | null;
  singleStatus?: string | null;
  affirmation?: string | null;
  acceptedTerms?: boolean | null;
  flow?: string | null;
  createdAt?: string | Date | null;
  avatar?: string | null;
  businessId?: string | null;
  clientProfileId?: string | null;
  vendedor?: {
  nombre: string;
  telefono?: string;
  avatar?: string | null;         // avatar del vendedor
  whatsappNumber?: string | null; // link de WhatsApp
  currentlyLink?: string | null;  // link de Calendly
} | null;

  // Archivos
  purchaseOrder?: string | null;
  flightTickets?: string | null;
  serviceVoucher?: string | null;
  medicalAssistanceCard?: string | null;
  travelTips?: string | null;
};

function formatDate(d?: string | Date | null) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default function UserProfile({ user }: { user: UserShape }) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = React.useState<string>(
    user.avatar ?? '/images/default-avatar.png'
  );
  const [loading, setLoading] = React.useState(false);
  const [showFiles, setShowFiles] = React.useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al subir avatar');
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
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  };

  const fileList: { label: string; url?: string | null }[] = [
    { label: 'Orden de compra', url: user.purchaseOrder },
    { label: 'Boletos de vuelo', url: user.flightTickets },
    { label: 'Voucher de servicio', url: user.serviceVoucher },
    { label: 'Tarjeta de asistencia médica', url: user.medicalAssistanceCard },
    { label: 'Tips de viaje', url: user.travelTips },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header principal */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center md:flex-row md:items-start gap-6">
        {/* Avatar con upload */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <Image
            src={avatarPreview}
            alt={user.name ?? 'User profile'}
            className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
            width={128}
            height={128}
          />
          <label
            htmlFor="avatar-upload"
            className="mt-3 text-sm text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md cursor-pointer"
          >
            {loading ? 'Subiendo...' : 'Cambiar foto'}
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
                {user.name ?? 'Sin nombre'}
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
                Editar perfil
              </button>
              <button
                onClick={logout}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Detalles del usuario */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-800">{user.phone ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">País</p>
              <p className="font-medium text-gray-800">{user.country ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Preferencia</p>
              <p className="font-medium text-gray-800">{user.preference ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Destino de interés</p>
              <p className="font-medium text-gray-800">{user.destino ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Estado civil</p>
              <p className="font-medium text-gray-800">{user.singleStatus ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Afirmación personal</p>
              <p className="font-medium text-gray-800">{user.affirmation ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Comentario</p>
              <p className="font-medium text-gray-800">{user.comment ?? 'No especificado'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Flujo</p>
              <p className="font-medium text-gray-800">{user.flow ?? 'No especificado'}</p>
            </div>
          </div>

          {/* Archivos subidos */}
          <div className="mt-6">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="w-full text-left px-4 py-2 bg-purple-100 text-purple-800 font-medium rounded-md hover:bg-purple-200"
            >
              {showFiles ? 'Ocultar archivos' : 'Ver archivos subidos'}
            </button>
            {showFiles && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {fileList.map((file) => (
                  <div
                    key={file.label}
                    className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">{file.label}</span>
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

      {/* Secciones adicionales */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Destinos recomendados</h2>
        <DestinationsList userDestino={user.destino ?? undefined} />
      </div>

      {/* Vendedor asignado */}
<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
  {user.vendedor ? (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4">
      {/* Avatar del vendedor */}
      <div className="relative w-20 h-20">
        <Image
          src={user.vendedor.avatar || '/images/default-avatar.png'}
          alt={user.vendedor.nombre}
          fill
          className="rounded-full object-cover border-2 border-gray-200"
        />
      </div>

      {/* Nombre del vendedor */}
      <p className="text-gray-700 font-medium">{user.vendedor.nombre}</p>

      {/* Botones de contacto */}
      <div className="flex gap-4">
        {user.vendedor.whatsappNumber && (
          <a
            href={user.vendedor.whatsappNumber}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            <Image src="/favicons/whatsapp.svg" alt="WhatsApp" width={20} height={20} />
            WhatsApp
          </a>
        )}
        {user.vendedor.currentlyLink && (
          <a
            href={user.vendedor.currentlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Image src="/favicons/calendly.svg" alt="Calendly" width={20} height={20} />
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

    </div>
  );
}
