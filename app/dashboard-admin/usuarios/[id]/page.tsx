import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminUserEditForm from "@/app/components/admin/AdminUserEditForm";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const user = await prisma.user.findFirst({
    where: { id: params.id, businessId: auth.businessId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      role: true,
      status: true,
      commissionRate: true,
      createdAt: true,
      purchaseOrder: true,
      flightTickets: true,
      serviceVoucher: true,
      medicalAssistanceCard: true,
      travelTips: true,
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{user.name || "Usuario"}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <a href="/dashboard-admin/usuarios" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Perfil</h2>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="text-gray-500">Nombre: </span>
              {user.name || "—"}
            </div>
            <div>
              <span className="text-gray-500">Email: </span>
              {user.email}
            </div>
            <div>
              <span className="text-gray-500">Teléfono: </span>
              {user.phone || "—"}
            </div>
            <div>
              <span className="text-gray-500">País: </span>
              {user.country || "—"}
            </div>
            <div>
              <span className="text-gray-500">Creado: </span>
              {new Date(user.createdAt).toLocaleString("es-CO")}
            </div>
            <div>
              <span className="text-gray-500">Orden de compra: </span>
              {user.purchaseOrder || "—"}
            </div>
            <div>
              <span className="text-gray-500">Tickets de vuelo: </span>
              {user.flightTickets || "—"}
            </div>
            <div>
              <span className="text-gray-500">Voucher de servicio: </span>
              {user.serviceVoucher || "—"}
            </div>
            <div>
              <span className="text-gray-500">Asistencia médica: </span>
              {user.medicalAssistanceCard || "—"}
            </div>
            <div>
              <span className="text-gray-500">Tips de viaje: </span>
              {user.travelTips || "—"}
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Editar</h2>
          <AdminUserEditForm
            user={{
              id: user.id,
              role: user.role,
              status: user.status,
              commissionRate: user.commissionRate ? Number(user.commissionRate) : null,
              purchaseOrder: user.purchaseOrder || "",
              flightTickets: user.flightTickets || "",
              serviceVoucher: user.serviceVoucher || "",
              medicalAssistanceCard: user.medicalAssistanceCard || "",
              travelTips: user.travelTips || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
