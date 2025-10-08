"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/admin/AdminiSidebar";

type SidebarUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  avatar?: string | null;
};

export default function CollapsibleSidebar({ user }: { user: SidebarUser }) {
  // Estado anclado en colapsado
  const [collapsed, setCollapsed] = useState(false);
  // Hover para “peek” temporal
  const [hovered, setHovered] = useState(false);

  // Persistencia
  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsedV2");
    if (saved === "true") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsedV2", String(collapsed));
  }, [collapsed]);

  // Si está anclado (colapsado) y NO hay hover => solo franja
  const effectiveCollapsed = collapsed && !hovered;
  const widthClass = effectiveCollapsed ? "w-3" : "w-64";

  return (
    <div
      className={`relative sticky top-0 h-dvh border-r bg-white transition-[width] duration-300 ${widthClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* FRANJA visible cuando está oculto */}
      {effectiveCollapsed && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-3 bg-gray-100"
        />
      )}

      {/* Contenido del sidebar: se renderiza SOLO cuando está expandido */}
      {!effectiveCollapsed && (
        <div className="h-full overflow-y-auto">
          <AdminSidebar user={user} />
        </div>
      )}

      {/* Flecha: siempre visible (solo md+) y pegada al borde derecho del contenedor */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={effectiveCollapsed ? "Expandir menú" : "Colapsar menú"}
        title={effectiveCollapsed ? "Expandir" : "Colapsar"}
        className="hidden md:flex absolute top-1/2 right-0 z-30 -translate-y-1/2 translate-x-1/2
                   h-6 w-6 items-center justify-center rounded-full border bg-white shadow"
      >
        <span className="text-xs select-none leading-none">
          {effectiveCollapsed ? "›" : "‹"}
        </span>
      </button>
    </div>
  );
}
