import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import EditReservationForm from "@/app/components/admin/reservations/EditReservationForm";
import UpdateReservationStatus from "@/app/components/admin/reservations/UpdateReservationStatus"
function money(n: number, currency = "USD") {
  try { return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}

export default async function AdminReservationDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");
  const businessId = auth.businessId!;

  const r = await prisma.reservation.findFirst({
    where: { id: params.id, businessId },
    select: {
      id: true, code: true, status: true, startDate: true, endDate: true,
      paxAdults: true, paxChildren: true, currency: true, totalAmount: true,
      notes: true, createdAt: true, updatedAt: true,
      client: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true } },
      destination: { select: { id: true, name: true, country: true } },
    },
  });
  if (!r) notFound();

  const [sellers, clients, destinations] = await Promise.all([
    prisma.user.findMany({ where: { businessId, role: "SELLER", status: "ACTIVE" }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }),
    prisma.destination.findMany({ where: { businessId }, select: { id: true, name: true, country: true }, orderBy: [{ popularityScore: "desc" }, { name: "asc" }], take: 300 }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{r.code}</h1>
          <p className="text-sm text-gray-500">
            {r.client?.name || "—"} · {r.destination?.name || "—"} ({r.destination?.country}) · {r.seller?.name || "—"}
          </p>
        </div>
        <a href="/dashboard-admin/reservas" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Estado</h2>
          <UpdateReservationStatus id={r.id} status={r.status as any} />
          <div className="mt-3 text-xs text-gray-500">
            Creado: {new Date(r.createdAt).toLocaleString("es-CO")} · Actualizado: {new Date(r.updatedAt).toLocaleString("es-CO")}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Totales</h2>
          <div className="text-2xl font-semibold">{money(Number(r.totalAmount), r.currency)} <span className="text-sm text-gray-500">({r.currency})</span></div>
          <div className="text-sm text-gray-500">PAX: {r.paxAdults} adultos / {r.paxChildren} niños</div>
          <div className="text-sm text-gray-500">Fechas: {new Date(r.startDate).toLocaleDateString("es-CO")} → {new Date(r.endDate).toLocaleDateString("es-CO")}</div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Editar reserva</h2>
        <EditReservationForm
          reservation={{
            id: r.id,
            sellerId: r.seller?.id || "",
            clientId: r.client?.id || "",
            destinationId: r.destination?.id || "",
            startDate: r.startDate.toISOString().slice(0,10),
            endDate: r.endDate.toISOString().slice(0,10),
            paxAdults: r.paxAdults,
            paxChildren: r.paxChildren,
            currency: r.currency,
            totalAmount: Number(r.totalAmount),
            notes: r.notes || "",
          }}
          sellers={sellers}
          clients={clients}
          destinations={destinations}
        />
      </section>
    </div>
  );
}
