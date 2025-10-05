import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import NewReservationForm from "@/app/components/admin/reservations/NewReservationForm";

export default async function NewReservationPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const [sellers, clients, destinations] = await Promise.all([
    prisma.user.findMany({ where: { businessId, role: "SELLER", status: "ACTIVE" }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { businessId, isArchived: false }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" }, take: 200 }),
    prisma.destination.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true, country: true }, orderBy: [{ popularityScore: "desc" }, { name: "asc" }], take: 200 }),
  ]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva reserva</h1>
        <a href="/dashboard-admin/reservas" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
      </header>
      <div className="rounded-xl border bg-white p-4">
        <NewReservationForm sellers={sellers} clients={clients} destinations={destinations} />
      </div>
    </div>
  );
}
