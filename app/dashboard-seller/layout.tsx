// app/dashboard-seller/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import SellerSidebar from "@/app/components/seller/SellerSidebar";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "SELLER" && auth.role !== "ADMIN") redirect("/unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  return (
    <div className="grid min-h-dvh grid-cols-[260px_1fr]">
      <aside className="border-r bg-white">
        <SellerSidebar
          user={{
            id: user?.id || "",
            name: user?.name || "Sin nombre",
            email: user?.email || "",
            role: (user?.role || "SELLER") as "ADMIN" | "SELLER" | "USER",
            avatar: user?.avatar || "/images/default-avatar.png",
          }}
        />
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
