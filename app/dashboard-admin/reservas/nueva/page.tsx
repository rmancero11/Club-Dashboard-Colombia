import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import NewReservationForm from "@/app/components/admin/reservations/NewReservationForm";

const STATUS_OPTIONS = [
  { value: "LEAD", label: "Prospecto" },
  { value: "QUOTED", label: "Cotizado" },
  { value: "HOLD", label: "En espera" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "TRAVELING", label: "En viaje" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELED", label: "Cancelada" },
  { value: "EXPIRED", label: "Vencida" },
] as const;

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD (US$)" },
  { value: "COP", label: "COP ($)" },
  { value: "EUR", label: "EUR (€)" },
] as const;

function todayIso() {
  const d = new Date();
  // YYYY-MM-DD
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}
function plusDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

export default async function NewReservationPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const [sellers, clients, destinations] = await Promise.all([
    prisma.user.findMany({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { businessId, isArchived: false },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.destination.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, country: true },
      orderBy: [{ popularityScore: "desc" }, { name: "asc" }],
      take: 200,
    }),
  ]);

  // Valores coherentes con el schema.prisma (status por defecto: LEAD)
  const initialValues = {
    // IDs (vacíos hasta que el usuario seleccione)
    sellerId: "",
    clientId: "",
    destinationId: "",

    // Fechas: hoy y +7 días como ejemplo (ajústalo si prefieres)
    startDate: todayIso(),
    endDate: plusDaysIso(7),

    paxAdults: 1,
    paxChildren: 0,

    currency: "USD",
    totalAmount: 0,

    status: "LEAD" as const,
    notes: "",
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva reserva</h1>
        <a
          href="/dashboard-admin/reservas"
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <NewReservationForm
          sellers={sellers}
          clients={clients}
          destinations={destinations}
          initialValues={initialValues as any}
          statusOptions={STATUS_OPTIONS as any}
          currencyOptions={CURRENCY_OPTIONS as any}
        />
      </div>

      {/* Sugerencias al usuario para evitar errores de creación */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Guía rápida</h2>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>
            <span className="font-medium">Estado</span>: comienza como{" "}
            <span className="italic">Prospecto (LEAD)</span>, y cambia según el
            embudo (Cotizado → En espera → Confirmada → En viaje → Completada).
          </li>
          <li>
            <span className="font-medium">Fechas</span>: asegúrate de que la{" "}
            <span className="italic">fecha de inicio</span> sea anterior a la{" "}
            <span className="italic">fecha de fin</span>.
          </li>
          <li>
            <span className="font-medium">Moneda</span>: por defecto USD. Puedes
            elegir COP o EUR si aplica.
          </li>
          <li>
            <span className="font-medium">Pasajeros (PAX)</span>: adultos y
            niños según el grupo que viaje.
          </li>
        </ul>
      </div>
    </div>
  );
}
