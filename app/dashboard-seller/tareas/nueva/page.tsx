import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import SellerNewTaskForm from "@/app/components/seller/tasks/SellerNewTaskForm";

export default async function NewSellerTaskPage({
  searchParams,
}: { searchParams?: { clientId?: string; reservationId?: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.businessId) redirect("/unauthorized");
  if (!["SELLER","ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const sellerId = auth.userId!;

  // Clientes del vendedor (activos)
  const clients = await prisma.client.findMany({
    where: { businessId, sellerId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 300,
  });

  // Si viene clientId, precargamos reservas de ese cliente; si no, dejamos vacío (el form las pedirá por fetch)
  let reservations: { id: string; code: string; destination: { name: string } | null }[] = [];
  if (searchParams?.clientId) {
    reservations = await prisma.reservation.findMany({
      where: { businessId, sellerId, clientId: searchParams.clientId },
      select: { id: true, code: true, destination: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva tarea</h1>
        <a href="/dashboard-seller/clientes" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <SellerNewTaskForm
          defaultClientId={searchParams?.clientId ?? null}
          defaultReservationId={searchParams?.reservationId ?? null}
          clients={clients}
          initialReservations={reservations}
        />
      </div>
    </div>
  );
}
