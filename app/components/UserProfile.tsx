'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
};

function roleColor(role: Role) {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'SELLER': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}

function formatDate(d?: string | Date | null) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
}

function getInitials(name?: string | null, email?: string) {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export default function UserProfile({ user }: { user: UserShape }) {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Avatar (img si hay url, sino iniciales) */}
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name ?? user.email}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-700 ring-2 ring-gray-100">
            {getInitials(user.name, user.email)}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-xl font-semibold">{user.name || 'Sin nombre'}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>{user.email}</span>
            <span className="text-gray-300">•</span>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${roleColor(user.role)}`}>
              {user.role}
            </span>
            {user.businessId && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">Business: {user.businessId.slice(0, 8)}…</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Teléfono</div>
          <div className="mt-1 text-sm">{user.phone || '—'}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">País</div>
          <div className="mt-1 text-sm">{user.country || '—'}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Presupuesto</div>
          <div className="mt-1 text-sm">{user.budget || '—'}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Preferencias</div>
          <div className="mt-1 text-sm">{user.preference || '—'}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Destino de interés</div>
          <div className="mt-1 text-sm">{user.destino || '—'}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Creado</div>
          <div className="mt-1 text-sm">{formatDate(user.createdAt)}</div>
        </div>
      </div>

      {/* Acciones / accesos rápidos */}
      <div className="mt-6 flex flex-wrap gap-3">
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
        {user.clientProfileId && (
          <span className="rounded-lg border px-3 py-2 text-sm text-gray-700">
            Perfil CRM conectado
          </span>
        )}
      </div>
    </div>
  );
}
