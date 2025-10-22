import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

import AccountSettingsForm from "@/app/components/admin/settings/AccountSettingsForm";
import ChangePasswordForm from "@/app/components/admin/settings/ChangePasswordForm";

export default async function AdminSettingsPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  // Solo obtenemos los datos del usuario actual (no existe Business ni Branch en el schema)
  const me = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      timezone: true,
      // Puedes exponer más campos del modelo User si tu formulario los soporta:
      // avatar: true,
      // commissionRate: true,
      // whatsappNumber: true,
      // currentlyLink: true,
    },
  });

  if (!me) redirect("/unauthorized");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configuración</h1>
          <p className="text-sm text-gray-500">Ajustes de tu cuenta de administrador.</p>
        </div>
      </header>

      {/* Mi cuenta */}
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
