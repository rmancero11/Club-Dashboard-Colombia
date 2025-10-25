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

export default function AdminSidebar({
  user,
  onNavigate,
}: {
  user: SidebarUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const NAV = [
    { href: "/dashboard-admin", label: "Inicio", exact: true },
    { href: "/dashboard-admin/vendedores", label: "Vendedores" },
    { href: "/dashboard-admin/clientes", label: "Clientes" },
    { href: "/dashboard-admin/destinos", label: "Destinos" },
    { href: "/dashboard-admin/reservas", label: "Reservas" },
    { href: "/dashboard-admin/reportes", label: "Reportes" },
    { href: "/dashboard-admin/configuracion", label: "Configuración" },
  ];

  const isActive = useCallback(
    (href: string, exact?: boolean) =>
      exact ? pathname === href : pathname?.startsWith(href),
    [pathname]
  );

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
    } finally {
      onNavigate?.();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Branding */}
      <div className="p-5 flex flex-col items-center md:items-start border-b border-gray-200">
        <Link
          href="/dashboard-admin"
          onClick={onNavigate}
          className="block transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/images/LogoAmigos.png"
            alt="Logo ClubSolteros"
            width={200}
            height={200}
            className="object-contain opacity-95 hover:opacity-100 transition-opacity duration-300"
            priority
          />
        </Link>
        <p className="mt-1 text-sm text-gray-500 text-center md:text-left">
          Panel de Administración
        </p>
      </div>

      {/* Admin card */}
      <div className="mx-4 mt-4 mb-3 rounded-xl border bg-white p-3 shadow-sm">
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
            <div className="truncate text-sm font-medium text-gray-800">
              {user.name}
            </div>
            <div className="truncate text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              isActive(item.href, item.exact)
                ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="border-t p-3 bg-white">
        <button
          onClick={logout}
          className="w-full rounded-md border px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
