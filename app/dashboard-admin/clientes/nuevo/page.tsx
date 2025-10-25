import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import CreateClientForm from "@/app/components/admin/clients/CreateClientForm";

export default async function NewClientPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: [{ name: "asc" }],
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="relative w-full max-w-2xl rounded-xl border bg-white p-6 shadow-xl">
        <a
          href="/dashboard-admin/clientes"
          className="absolute left-4 top-4 text-sm font-medium text-fuchsia-700 hover:text-fuchsia-900"
        >
          ← Volver
        </a>

        <h1 className="mt-4 mb-2 text-center text-2xl font-semibold text-gray-800">
          Nuevo cliente
        </h1>
        <p className="mb-4 text-center text-sm text-gray-500">
          Se creará un <b>nuevo usuario</b> (rol USER) y su ficha de cliente asociada.
        </p>

        <CreateClientForm sellers={sellers} />
      </div>
    </div>
  );
}
