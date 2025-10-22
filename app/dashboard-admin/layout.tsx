import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import MobileNav from "@/app/components/admin/MobileNav";
import CollapsibleSidebar from "@/app/components/admin/CollapsibleSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  const sidebarUser = {
    id: user?.id ?? "",
    name: user?.name ?? "Administrador",
    email: user?.email ?? "",
    role: "ADMIN" as const,
    avatar: user?.avatar ?? "/images/default-avatar.png",
  };

  return (
    <div className="min-h-dvh">
      {/* Móvil: topbar + drawer */}
      <MobileNav user={sidebarUser} />

      {/* md+: sidebar colapsable + contenido */}
      <div className="md:flex md:min-h-dvh">
        {/* Oculto en móvil, visible en md+ */}
        <div className="hidden md:block">
          <CollapsibleSidebar user={sidebarUser} />
        </div>

        {/* Contenido */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
