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

export default function SellerMobileNav({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);

  // Bloquear scroll cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Topbar móvil */}
      <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="rounded-md border px-3 py-2 text-sm font-medium"
        >
          ☰
        </button>
        <div className="text-base font-semibold">Panel de Vendedor</div>
        <div className="w-9" />
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r bg-white transition-transform md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">ClubSolteros</span>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="rounded-md border px-2 py-1 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="h-[calc(100dvh-52px)] overflow-y-auto">
          <SellerSidebar
            user={user}
            // Cerrar el drawer al navegar (igual que en admin)
            onNavigate={() => setOpen(false)}
          />
        </div>
      </aside>
    </>
  );
}
