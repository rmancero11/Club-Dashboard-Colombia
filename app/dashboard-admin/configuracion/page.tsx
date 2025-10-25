import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import AccountSettingsForm from "@/app/components/admin/settings/AccountSettingsForm";
import ChangePasswordForm from "@/app/components/admin/settings/ChangePasswordForm";

export default async function AdminSettingsPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const me = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      timezone: true,
    },
  });

  if (!me) redirect("/unauthorized");

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configuración</h1>
          <p className="text-sm text-gray-500">
            Ajustes de tu cuenta de administrador.
          </p>
        </div>

        {/* Botón para crear admin */}
        <Link
          href="/dashboard-admin/configuracion/nuevo-admin"
          className="rounded-md bg-fuchsia-700 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-fuchsia-800 transition-colors duration-200"
        >
          + Crear nuevo administrador
        </Link>
      </header>

      {/* Secciones */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Mi cuenta</h2>
          <AccountSettingsForm me={me} />
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
