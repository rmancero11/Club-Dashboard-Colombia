import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

/* ===== Utilidades ===== */
function fmtMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

// Mapas de visualización (coherentes con schema.prisma)
const TASK_STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
  CANCELLED: "Cancelada",
};
const TASK_PRIORITY_LABEL: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};
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

// Colores de badge por estado/prioridad
function statusBadgeClass(status: string) {
  switch (status) {
    case "DONE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-stone-200 bg-stone-50 text-stone-700";
    case "IN_PROGRESS":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "BLOCKED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default: // OPEN
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}
function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "MEDIUM":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    default: // LOW
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/* Indicativos básicos */
const DIAL_BY_COUNTRY: Record<string, string> = {
  Colombia: "57",
  México: "52",
  "Estados Unidos": "1",
  "United States": "1",
  Canadá: "1",
  Canada: "1",
  Perú: "51",
  Chile: "56",
  Argentina: "54",
  Ecuador: "593",
  Venezuela: "58",
  Brasil: "55",
  España: "34",
  Portugal: "351",
  Francia: "33",
  Italia: "39",
  Alemania: "49",
};
const digitsOnly = (v?: string) => (v || "").replace(/\D/g, "");
const normalizePhone = (v?: string | null) => (v || "").replace(/[^\d+]/g, "");
function toE164(phone?: string | null, country?: string | null) {
  const raw = normalizePhone(phone);
  if (!raw) return "";
  if (raw.startsWith("+")) return `+${digitsOnly(raw)}`;
  const dial = country ? DIAL_BY_COUNTRY[(country || "").trim()] : "";
  const local = digitsOnly(raw);
  if (!local) return "";
  return dial ? `+${dial}${local}` : `+${local}`;
}
const waLink = (e164?: string) => {
  const d = digitsOnly(e164);
  return d ? `https://wa.me/${d}` : "";
};

export default async function AdminTaskDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const now = new Date();

  const task = await prisma.task.findFirst({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,         // OPEN | IN_PROGRESS | BLOCKED | DONE | CANCELLED
      priority: true,       // LOW | MEDIUM | HIGH
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      seller: { select: { id: true, name: true, email: true, phone: true, country: true } },
      reservation: {
        select: {
          id: true,
          code: true,
          status: true,      // ReservationStatus
          startDate: true,
          endDate: true,
          totalAmount: true,
          currency: true,
          destination: { select: { name: true } },
          client: { select: { name: true } },
        },
      },
    },
  });

  if (!task) notFound();

  const isPending = ["OPEN", "IN_PROGRESS", "BLOCKED"].includes(task.status);
  const isOverdue = !!task.dueDate && isPending && task.dueDate < now;

  const statusClass = statusBadgeClass(task.status);
  const priorityClass = priorityBadgeClass(task.priority);

  const taskStatusEs = TASK_STATUS_LABEL[task.status] ?? task.status;
  const taskPriorityEs = TASK_PRIORITY_LABEL[task.priority] ?? task.priority;

  const sellerPhoneE164 = toE164(task.seller?.phone || undefined, task.seller?.country || undefined);
  const sellerWa = waLink(sellerPhoneE164);

  const resStatusEs = task.reservation ? (RES_STATUS_LABEL[task.reservation.status] ?? task.reservation.status) : "";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
              {taskStatusEs}
            </span>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${priorityClass}`}>
              Prioridad: {taskPriorityEs}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                Atrasada
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Creada: {new Date(task.createdAt).toLocaleDateString("es-CO")} ·{" "}
            Actualizada: {new Date(task.updatedAt).toLocaleDateString("es-CO")}
            {task.dueDate ? <> · Vence: {new Date(task.dueDate).toLocaleDateString("es-CO")}</> : null}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/dashboard-admin/vendedores/${task.seller?.id ?? ""}`} className="rounded-md border px-3 py-2 text-sm">
            ← Volver
          </a>
        </div>
      </header>

      {/* Sección principal */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Vendedor asignado */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-1 text-sm text-gray-500">Vendedor asignado</div>
          <div className="font-medium">{task.seller?.name || "—"}</div>
          <div className="text-xs text-gray-600 flex flex-col">
            {task.seller?.email ? (
              <a href={`mailto:${task.seller.email}`} className="underline text-blue-700">{task.seller.email}</a>
            ) : <span>—</span>}
            {sellerPhoneE164 ? (
              <a
                href={sellerWa}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-green-700"
                title="Abrir WhatsApp"
              >
                {sellerPhoneE164}
              </a>
            ) : task.seller?.phone ? (
              <span>{task.seller.phone}</span>
            ) : null}
            {task.seller?.country ? <span className="text-gray-400">{task.seller.country}</span> : null}
          </div>
          <div className="mt-2">
            <a href={`/dashboard-admin/vendedores/${task.seller?.id ?? ""}`} className="text-sm text-primary underline">
              Ver vendedor
            </a>
          </div>
        </div>

        {/* Reserva vinculada (si existe) */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-1 text-sm text-gray-500">Reserva vinculada</div>
          {task.reservation ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium">
                {task.reservation.code || "RES"} · {task.reservation.destination?.name || "—"}
              </div>
              <div className="text-xs text-gray-600">
                Estado: <span className="font-medium">{resStatusEs}</span>
              </div>
              <div className="text-xs text-gray-600">
                Cliente: {task.reservation.client?.name || "—"}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(task.reservation.startDate).toLocaleDateString("es-CO")} →{" "}
                {new Date(task.reservation.endDate).toLocaleDateString("es-CO")}
              </div>
              <div className="text-xs text-gray-600">
                {fmtMoney(Number(task.reservation.totalAmount || 0), task.reservation.currency || "USD")}
              </div>
              {/* <a href={`/dashboard-admin/reservas/${task.reservation.id}`} className="text-sm text-primary underline">Ver reserva</a> */}
            </div>
          ) : (
            <div className="text-gray-400">Sin reserva asociada</div>
          )}
        </div>

        {/* Estado y fechas */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-1 text-sm text-gray-500">Estado y fechas</div>
          <ul className="text-sm">
            <li><span className="text-gray-500">Estado:</span> <span className="font-medium">{taskStatusEs}</span></li>
            <li><span className="text-gray-500">Prioridad:</span> <span className="font-medium">{taskPriorityEs}</span></li>
            <li><span className="text-gray-500">Creada:</span> {new Date(task.createdAt).toLocaleDateString("es-CO")}</li>
            <li><span className="text-gray-500">Actualizada:</span> {new Date(task.updatedAt).toLocaleDateString("es-CO")}</li>
            <li><span className="text-gray-500">Vence:</span> {task.dueDate ? new Date(task.dueDate).toLocaleDateString("es-CO") : "—"}</li>
          </ul>
        </div>
      </section>

      {/* Descripción */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
        {task.description ? (
          <p className="whitespace-pre-wrap text-sm text-gray-800">{task.description}</p>
        ) : (
          <p className="text-sm text-gray-400">Sin descripción</p>
        )}
      </section>
    </div>
  );
}
