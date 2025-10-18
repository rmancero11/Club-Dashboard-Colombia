"use client";

import { useEffect, useState } from "react";
import SellerSidebar from "@/app/components/seller/SellerSidebar";

type Role = "ADMIN" | "SELLER" | "USER";
type SidebarUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
};

export default function SellerCollapsibleSidebar({ user }: { user: SidebarUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Persistencia local (clave separada para seller)
  useEffect(() => {
    const saved = localStorage.getItem("sellerSidebarCollapsedV2");
    if (saved === "true") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sellerSidebarCollapsedV2", String(collapsed));
  }, [collapsed]);

  const effectiveCollapsed = collapsed && !hovered;
  const widthClass = effectiveCollapsed ? "w-3" : "w-64";

  return (
    <div
      className={`relative sticky top-0 h-dvh border-r bg-white transition-[width] duration-300 ${widthClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Franja cuando está colapsado */}
      {effectiveCollapsed && (
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-3 bg-gray-100" />
      )}

      {/* Contenido del sidebar */}
      {!effectiveCollapsed && (
        <div className="h-full overflow-y-auto">
          <SellerSidebar user={user} />
        </div>
      )}

      {/* Flecha (solo md+) */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
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
