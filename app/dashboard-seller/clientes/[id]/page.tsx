import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.businessId) redirect("/unauthorized");

  const where: any = { id: params.id, businessId: auth.businessId };
  // Si no es admin, asegurar que sea su cliente
  if (auth.role !== "ADMIN") where.sellerId = auth.userId;

  const client = await prisma.client.findFirst({
    where,
    include: {
      reservations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { destination: true },
      },
    },
  });
  if (!client) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-gray-500">{client.email || "Sin email"} · {client.phone || "Sin teléfono"}</p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Reservas recientes</h2>
        {client.reservations.length === 0 ? (
          <div className="text-gray-400">Sin reservas</div>
        ) : (
          <ul className="divide-y">
            {client.reservations.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.destination.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.startDate).toLocaleDateString("es-CO")} → {new Date(r.endDate).toLocaleDateString("es-CO")} · {r.status}
                    </div>
                  </div>
                  <a className="text-sm text-primary underline" href={`/dashboard-seller/reservas/${r.id}`}>Ver</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
