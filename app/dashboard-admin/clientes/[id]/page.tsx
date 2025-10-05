import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminClientEditForm from "@/app/components/admin/AdminClientEditform";

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO");
}
function money(n: number, currency = "USD") {
  try { return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const client = await prisma.client.findFirst({
    where: { id: params.id, businessId },
    select: {
      id: true, name: true, email: true, phone: true, country: true, city: true,
      documentId: true, birthDate: true, tags: true, notes: true, isArchived: true,
      createdAt: true,
      seller: { select: { id: true, name: true, email: true } },
      _count: { select: { reservations: true } },
    },
  });
  if (!client) notFound();

  const [reservations, sellers] = await Promise.all([
    prisma.reservation.findMany({
      where: { businessId, clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, code: true, status: true, startDate: true, endDate: true, currency: true, totalAmount: true,
        destination: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {client.email || "—"} · {client.phone || "—"} · {client.city ? `${client.city}, ` : ""}{client.country || "—"}
          </p>
        </div>
        <a href="/dashboard-admin/clientes" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Información</h2>
          <div className="grid gap-1 text-sm">
            <div><span className="text-gray-500">Documento: </span>{client.documentId || "—"}</div>
            <div><span className="text-gray-500">Nacimiento: </span>{client.birthDate ? fmtDate(client.birthDate) : "—"}</div>
            <div><span className="text-gray-500">Vendedor: </span>{client.seller?.name || "—"}</div>
            <div><span className="text-gray-500">Reservas: </span>{client._count.reservations}</div>
            <div><span className="text-gray-500">Estado: </span>{client.isArchived ? "Archivado" : "Activo"}</div>
            <div className="mt-2">
              <div className="text-gray-500">Tags:</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {client.tags?.length ? client.tags.map(t => (
                  <span key={t} className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600">{t}</span>
                )) : <span>—</span>}
              </div>
            </div>
            <div className="mt-2">
              <div className="text-gray-500">Notas:</div>
              <div className="whitespace-pre-wrap">{client.notes || "—"}</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Creado: {fmtDate(client.createdAt)}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Editar</h2>
          <AdminClientEditForm
            clientId={client.id}
            currentSellerId={client.seller?.id || ""}
            currentArchived={client.isArchived}
            currentNotes={client.notes || ""}
            sellers={sellers}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Reservas recientes</h2>
        {reservations.length === 0 ? (
          <div className="text-gray-400">Sin reservas</div>
        ) : (
          <ul className="divide-y">
            {reservations.map(r => (
              <li key={r.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.destination?.name || "—"} · {r.code}</div>
                    <div className="text-xs text-gray-500">{new Date(r.startDate).toLocaleDateString("es-CO")} → {new Date(r.endDate).toLocaleDateString("es-CO")} · {r.status}</div>
                  </div>
                  <div className="text-sm">{money(Number(r.totalAmount), r.currency)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
