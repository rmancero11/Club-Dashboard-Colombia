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
  createdAt?: string | Date | null;
  avatar?: string | null;
  businessId?: string | null;
  clientProfileId?: string | null;
  vendedor?: { nombre: string; telefono?: string } | null;
};

function formatDate(d?: string | Date | null) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function UserProfile({ user }: { user: UserShape }) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = React.useState<string>(
    user.avatar ?? '/images/default-avatar.png'
  );
  const [loading, setLoading] = React.useState(false);

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
      setAvatarPreview(data.user.avatar); // URL real desde la API
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
              <h1 className="text-2xl font-bold text-gray-800">{user.name ?? 'Sin nombre'}</h1>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-1 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                {user.role}
              </span>
            </div>
            <div className="flex gap-2">
    <button
      onClick={() => router.push('/profile/edit')}
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

          {/* Detalles */}
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
          </div>
        </div>
      </div>

      {/* Secciones adicionales */}
      {/* Destinos */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Destinos recomendados</h2>
        <DestinationsList userDestino={user.destino ?? undefined} />
      </div>

      {/* Vendedor / viajeros */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-500">
          {user.vendedor ? (
            <p className="text-gray-700 font-medium">
              Vendedor asignado: {user.vendedor.nombre}
              {user.vendedor.telefono && <span> ({user.vendedor.telefono})</span>}
            </p>
          ) : (
            <p className="text-gray-500">No tienes un vendedor asignado</p>
          )}
        </div>
      </div>


      {/* Acceso rápido */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        {user.role === 'ADMIN' && (
          <a href="/dashboard-admin" className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90">
            Ir al Dashboard Admin
          </a>
        )}
        {user.role === 'SELLER' && (
          <a href="/dashboard-seller" className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90">
            Ir al Dashboard Seller
          </a>
        )}
        {user.role === 'USER' && (
          <a href="/dashboard-user" className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90">
            Ir a mi Dashboard
          </a>
        )}
      </div>
    </div>
  );
}
