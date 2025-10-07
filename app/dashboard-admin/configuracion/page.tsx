import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

import BusinessSettingsForm from "@/app/components/admin/settings/BusinessSettingsForm";
import BranchesManager from "@/app/components/admin/settings/BranchesManager";
import AccountSettingsForm from "@/app/components/admin/settings/AccountSettingsForm";
import ChangePasswordForm from "@/app/components/admin/settings/ChangePasswordForm";

export default async function AdminSettingsPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId;

  const [biz, branchesRaw, me] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true, Name: true, slug: true, country: true,
        Plan: true, Template: true, BusinessProgram: true, PricePlan: true,
        IconoWhite: true, Cover: true, SocialMedia: true, createdAt: true,
      },
    }),
    prisma.branch.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, address: true, mapsUrl: true, country: true, createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, name: true, phone: true, timezone: true },
    }),
  ]);

  if (!biz) redirect("/unauthorized");

  const branches = branchesRaw.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configuración</h1>
          <p className="text-sm text-gray-500">Ajustes de la empresa, sucursales y tu cuenta.</p>
        </div>
      </header>

      {/* Empresa */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Empresa</h2>
        <BusinessSettingsForm business={biz} />
      </section>

      {/* Sucursales */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Sucursales</h2>
        <BranchesManager initialBranches={branches} />
      </section>

      {/* Mi cuenta */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Mi cuenta</h2>
          <AccountSettingsForm me={me!} />
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
