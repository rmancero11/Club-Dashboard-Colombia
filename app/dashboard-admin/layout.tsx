import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import AdminSidebar from "@/app/components/admin/AdminiSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) redirect("/unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  return (
    <div className="grid min-h-dvh grid-cols-[260px_1fr]">
      <aside className="border-r bg-white">
        <AdminSidebar
          user={{
            id: user?.id || "",
            name: user?.name || "Administrador",
            email: user?.email || "",
            role: "ADMIN",
            avatar: user?.avatar || "/images/default-avatar.png",
          }}
        />
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
