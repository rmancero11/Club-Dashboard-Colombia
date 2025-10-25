import { redirect } from "next/navigation";
import { getAuth } from "@/app/lib/auth";
import CreateAdminForm from "@/app/components/admin/settings/CreateAdminForm";

export default async function NewAdminPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Nuevo administrador</h1>
        <p className="text-sm text-gray-500">
          Crea una cuenta con rol <span className="font-medium">ADMIN</span>.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Datos del nuevo admin</h2>
          <CreateAdminForm />
        </div>
      </section>
    </div>
  );
}
