import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { notFound, redirect } from "next/navigation";
import SellerClientDocumentsForm from "@/app/components/seller/SellerClientDocumentsform";

/** Utils */
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO");
}
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    const val = Number.isFinite(n) ? n.toFixed(2) : String(n);
    return `${currency} ${val}`;
  }
}
// Etiquetas legibles para archivos
const fileLabels: Record<string, string> = {
  purchaseOrder: "Orden de compra",
  flightTickets: "Boletos de vuelo",
  serviceVoucher: "Voucher de servicio",
  medicalAssistanceCard: "Asistencia médica",
  travelTips: "Tips de viaje",
};
// Etiquetas para estados de reserva (schema.prisma)
const RES_STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  QUOTED: "Cotizada",
  HOLD: "En hold",
  CONFIRMED: "Confirmada",
  TRAVELING: "Viajando",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.businessId) redirect("/unauthorized");

  // Filtro multi-tenant + pertenencia al seller si no es ADMIN
  const where: any = { id: params.id, businessId: auth.businessId };
  if (auth.role !== "ADMIN") where.sellerId = auth.userId;

  // Traemos info completa del cliente y sus 10 reservas más recientes
  const client = await prisma.client.findFirst({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      documentId: true,
      birthDate: true,
      tags: true,
      notes: true,
      isArchived: true,
      createdAt: true,
      seller: { select: { id: true, name: true, email: true } },
      _count: { select: { reservations: true } },
      user: {
        select: {
          purchaseOrder: true,
          flightTickets: true,
          serviceVoucher: true,
          medicalAssistanceCard: true,
          travelTips: true,
        },
      },
      reservations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          code: true,
          status: true,
          startDate: true,
          endDate: true,
          currency: true,
          totalAmount: true,
          destination: { select: { name: true } },
        },
      },
    },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {client.email || "—"} · {client.phone || "—"} ·{" "}
            {client.city ? `${client.city}, ` : ""}{client.country || "—"}
          </p>
        </div>
        <a
          href="/dashboard-seller/clientes"
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </a>
      </header>

      {/* Información + Documentos (edición por seller) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información del cliente */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Información</h2>
          <div className="grid gap-1 text-sm">
            <div>
              <span className="text-gray-500">Documento: </span>
              {client.documentId || "—"}
            </div>
            <div>
              <span className="text-gray-500">Nacimiento: </span>
              {client.birthDate ? fmtDate(client.birthDate) : "—"}
            </div>
            <div>
              <span className="text-gray-500">Vendedor: </span>
              {client.seller?.name || "—"}
            </div>
            <div>
              <span className="text-gray-500">Reservas: </span>
              {client._count.reservations}
            </div>
            <div>
              <span className="text-gray-500">Estado: </span>
              {client.isArchived ? "Archivado" : "Activo"}
            </div>

            <div className="mt-2">
              <div className="text-gray-500">Tags:</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {client.tags?.length
                  ? client.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600"
                      >
                        {t}
                      </span>
                    ))
                  : "—"}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-gray-500">Notas:</div>
              <div className="whitespace-pre-wrap">
                {client.notes || "—"}
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Creado: {fmtDate(client.createdAt)}
            </div>

            {/* Listado de archivos (solo lectura) */}
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Documentos</h3>
              {client.user ? (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-600">
                    Ver archivos
                  </summary>
                  <div className="mt-1 flex flex-col gap-1">
                    {Object.entries(client.user).map(([key, url]) =>
                      url ? (
                        <a
                          key={key}
                          href={url as string}
                          target="_blank"
                          className="text-xs underline text-gray-700"
                        >
                          {fileLabels[key] || key}
                        </a>
                      ) : null
                    )}
                    {Object.values(client.user).every((v) => !v) && (
                      <div className="text-xs text-gray-400">No hay documentos</div>
                    )}
                  </div>
                </details>
              ) : (
                <div className="text-gray-400 text-sm">No hay documentos</div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de documentos (edición por el seller) */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Documentos del cliente</h2>
          <SellerClientDocumentsForm
            clientId={client.id}
            current={{
              purchaseOrder: client.user?.purchaseOrder ?? null,
              flightTickets: client.user?.flightTickets ?? null,
              serviceVoucher: client.user?.serviceVoucher ?? null,
              medicalAssistanceCard: client.user?.medicalAssistanceCard ?? null,
              travelTips: client.user?.travelTips ?? null,
            }}
            // Si tienes un endpoint de subida real (S3/Cloudinary), pásalo:
            // uploadEndpoint="/api/upload"
          />
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Acciones</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href={`/dashboard-seller/reservas/nueva?clientId=${client.id}`}
            className="rounded-md bg-black px-3 py-2 text-white"
          >
            Crear reserva
          </a>
          <a
            href={`/dashboard-seller/tareas/nueva?clientId=${client.id}`}
            className="rounded-md border px-3 py-2"
          >
            Crear tarea
          </a>
        </div>
      </div>

      {/* Reservas recientes */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Reservas recientes</h2>
        {client.reservations.length === 0 ? (
          <div className="text-gray-400">Sin reservas</div>
        ) : (
          <ul className="divide-y">
            {client.reservations.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {r.destination?.name || "—"} · {r.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.startDate).toLocaleDateString("es-CO")} →{" "}
                      {new Date(r.endDate).toLocaleDateString("es-CO")} ·{" "}
                      {RES_STATUS_LABEL[r.status as keyof typeof RES_STATUS_LABEL] ?? r.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      {money(Number(r.totalAmount), r.currency)}
                    </div>
                    <a
                      className="text-sm text-primary underline"
                      href={`/dashboard-seller/reservas/${r.id}`}
                    >
                      Ver
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
