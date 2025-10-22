import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import SellerNewTaskForm from "@/app/components/seller/tasks/SellerNewTaskForm";

export default async function NewSellerTaskPage({
  searchParams,
}: {
  searchParams?: { clientId?: string; reservationId?: string };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const sellerId = auth.userId!;

  // Clientes visibles: si es SELLER, solo sus clientes; si es ADMIN, todos los no archivados
  const clients = await prisma.client.findMany({
    where: {
      isArchived: false,
      ...(auth.role !== "ADMIN" ? { sellerId } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 300,
  });

  // Si viene clientId, precargamos reservas; filtradas por seller si no es ADMIN
  let reservations:
    | { id: string; code: string; destination: { name: string } | null }[]
    | [] = [];

  if (searchParams?.clientId) {
    reservations = await prisma.reservation.findMany({
      where: {
        clientId: searchParams.clientId,
        ...(auth.role !== "ADMIN" ? { sellerId } : {}),
      },
      select: {
        id: true,
        code: true,
        destination: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva tarea</h1>
        <a
          href="/dashboard-seller/tareas"
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </a>
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
