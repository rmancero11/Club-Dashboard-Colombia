"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import Image from "next/image";

type SidebarUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  avatar?: string | null;
};

const NAV = [
  { href: "/dashboard-admin", label: "Inicio", exact: true },
  { href: "/dashboard-admin/usuarios", label: "Usuarios" },
  { href: "/dashboard-admin/vendedores", label: "Vendedores" },
  { href: "/dashboard-admin/clientes", label: "Clientes" },
  { href: "/dashboard-admin/destinos", label: "Destinos" },
  { href: "/dashboard-admin/reservas", label: "Reservas" },
  { href: "/dashboard-admin/reportes", label: "Reportes" },
  { href: "/dashboard-admin/configuracion", label: "Configuración" },
];

export default function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = useCallback(
    (href: string, exact?: boolean) =>
      exact ? pathname === href : pathname?.startsWith(href),
    [pathname]
  );

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="p-4">
        <Link href="/dashboard-admin" className="block text-xl font-semibold">
          ClubSolteros
        </Link>
        <p className="text-sm text-gray-500">Panel de Administración</p>
      </div>

      {/* Admin card */}
      <div className="mx-2 mb-2 rounded-xl border bg-white p-3">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
              width={150}
              height={150}
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
              {user.name?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              isActive(item.href, item.exact)
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="border-t p-3">
        <button
          onClick={logout}
          className="w-full rounded-md border px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
