import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

import EditDestinationForm from "@/app/components/admin/destinations/EditDestinationForm";
import ToggleActive from "@/app/components/admin/destinations/ToggleActive";
import DeleteDestinationButton from "@/app/components/admin/destinations/DeleteDestinationButton";

function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export default async function AdminDestinationDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const d = await prisma.destination.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
      category: true,
      description: true,
      imageUrl: true,
      isActive: true,
      popularityScore: true,
      price: true,          // Decimal | null
      discountPrice: true,  // Decimal | null
      createdAt: true,
      updatedAt: true,
      _count: { select: { reservations: true } },
    },
  });

  if (!d) notFound();

  // Convertimos Decimals a number, preservando null
  const price = d.price !== null ? Number(d.price) : null;
  const discountPrice = d.discountPrice !== null ? Number(d.discountPrice) : null;

  const recentReservations = await prisma.reservation.findMany({
    where: { destinationId: d.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      code: true,
      totalAmount: true, // Decimal
      currency: true,
      status: true,
      client: { select: { name: true } },
      startDate: true,
      endDate: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{d.name}</h1>
          <p className="text-sm text-gray-500">
            {[d.city, d.country].filter(Boolean).join(", ") || d.country} · {d.category || "Sin categoría"}
          </p>
        </div>
        <a href="/dashboard-admin/destinos" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info y edición */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Editar destino</h2>
          <EditDestinationForm
            dest={{
              id: d.id,
              name: d.name,
              country: d.country,
              city: d.city,
              category: d.category,
              description: d.description,
              imageUrl: d.imageUrl,
              // price: string | number
              price: price !== null ? price : "",
              // discountPrice: string | number | null
              discountPrice: discountPrice !== null ? discountPrice : null,
            }}
          />

          <div className="mt-3 flex gap-2">
            <ToggleActive id={d.id} isActive={d.isActive} />
            <DeleteDestinationButton id={d.id} />
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Popularidad: {d.popularityScore} · Creado: {new Date(d.createdAt).toLocaleString("es-CO")} ·{" "}
            Actualizado: {new Date(d.updatedAt).toLocaleString("es-CO")}
          </div>

          {/* Precios actuales */}
          <div className="mt-3 text-sm">
            <p>
              <strong>Precio:</strong>{" "}
              {price !== null ? money(price) : <span className="text-gray-400">No definido</span>}
            </p>
            <p>
              <strong>Precio con descuento:</strong>{" "}
              {discountPrice !== null ? money(discountPrice) : <span className="text-gray-400">No definido</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Reservas vinculadas: {d._count.reservations}
            </p>
          </div>
        </div>

        {/* Reservas recientes */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Reservas recientes</h2>
          {recentReservations.length === 0 ? (
            <div className="text-gray-400">Sin reservas</div>
          ) : (
            <ul className="divide-y">
              {recentReservations.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {r.code} · {r.client?.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(r.startDate).toLocaleDateString("es-CO")} →{" "}
                        {new Date(r.endDate).toLocaleDateString("es-CO")} · {r.status}
                      </div>
                    </div>
                    <div className="text-sm">
                      {money(Number(r.totalAmount), r.currency)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
