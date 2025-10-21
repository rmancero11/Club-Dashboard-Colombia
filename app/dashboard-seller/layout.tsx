import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import SellerMobileNav from "@/app/components/seller/MobileNav";
import SellerCollapsibleSidebar from "@/app/components/seller/CollapsibleSidebar";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "SELLER" && auth.role !== "ADMIN") redirect("/unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  const sidebarUser = {
    id: user?.id || "",
    name: user?.name || "Vendedor",
    email: user?.email || "",
    role: (user?.role || "SELLER") as "ADMIN" | "SELLER" | "USER",
    avatar: user?.avatar || "/images/default-avatar.png",
  };

  return (
    <div className="min-h-dvh">
      {/* Móvil: topbar + drawer */}
      <SellerMobileNav user={sidebarUser} />

      {/* md+: sidebar colapsable + contenido */}
      <div className="md:flex md:min-h-dvh">
        <div className="hidden md:block">
          <SellerCollapsibleSidebar user={sidebarUser} />
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
