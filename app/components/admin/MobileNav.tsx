"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/app/components/admin/AdminiSidebar";

type SidebarUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  avatar?: string | null;
};

export default function MobileNav({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // bloquear scroll cuando está abierto
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
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
        <div className="text-base font-semibold">Panel de Administración</div>
        <div className="w-9" />
      </div>

      {/* Overlay (solo móvil) */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer (solo móvil) */}
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
          <AdminSidebar
            user={user}
            // cerramos al navegar (prop opcional)
            onNavigate={() => setOpen(false)}
          />
        </div>
      </aside>
    </>
  );
}
