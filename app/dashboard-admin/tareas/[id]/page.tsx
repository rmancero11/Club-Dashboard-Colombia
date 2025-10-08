import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

function fmtMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export default async function AdminTaskDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const now = new Date();

  const task = await prisma.task.findFirst({
    where: { id: params.id, businessId },
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

  const statusClass =
    task.status === "DONE" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : task.status === "CANCELLED" ? "border-stone-200 bg-stone-50 text-stone-700"
    : task.status === "IN_PROGRESS" ? "border-sky-200 bg-sky-50 text-sky-700"
    : task.status === "BLOCKED" ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-gray-200 bg-gray-50 text-gray-700"; // OPEN

  const priorityClass =
    task.priority === "HIGH" ? "border-rose-200 bg-rose-50 text-rose-700"
    : task.priority === "MEDIUM" ? "border-indigo-200 bg-indigo-50 text-indigo-700"
    : "border-gray-200 bg-gray-50 text-gray-700"; // LOW

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
              {task.status}
            </span>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${priorityClass}`}>
              Prioridad: {task.priority}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                Atrasada
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Creada: {new Date(task.createdAt).toLocaleDateString("es-CO")} ·
            {" "}Actualizada: {new Date(task.updatedAt).toLocaleDateString("es-CO")}
            {task.dueDate ? <> · Vence: {new Date(task.dueDate).toLocaleDateString("es-CO")}</> : null}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Volver al vendedor asignado */}
          <a
            href={`/dashboard-admin/vendedores/${task.seller.id}`}
            className="rounded-md border px-3 py-2 text-sm"
          >
            ← Volver
          </a>
        </div>
      </header>

      {/* Info principal */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Vendedor asignado */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-1 text-sm text-gray-500">Vendedor asignado</div>
          <div className="font-medium">{task.seller.name || "—"}</div>
          <div className="text-xs text-gray-600">
            {task.seller.email} {task.seller.phone ? `· ${task.seller.phone}` : ""} {task.seller.country ? `· ${task.seller.country}` : ""}
          </div>
          <div className="mt-2">
            <a href={`/dashboard-admin/vendedores/${task.seller.id}`} className="text-sm text-primary underline">
              Ver vendedor
            </a>
          </div>
        </div>

        {/* Reserva relacionada (si existe) */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-1 text-sm text-gray-500">Reserva vinculada</div>
          {task.reservation ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium">
                {task.reservation.code || "RES"} · {task.reservation.destination?.name || "—"}
              </div>
              <div className="text-xs text-gray-600">
                Cliente: {task.reservation.client?.name || "—"}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(task.reservation.startDate).toLocaleDateString("es-CO")} → {new Date(task.reservation.endDate).toLocaleDateString("es-CO")}
              </div>
              <div className="text-xs text-gray-600">
                {fmtMoney(Number(task.reservation.totalAmount || 0), task.reservation.currency || "USD")}
              </div>
              {/* Si más adelante creas /dashboard-admin/reservas/[id], puedes enlazarlo: */}
              {/* <a href={`/dashboard-admin/reservas/${task.reservation.id}`} className="text-sm text-primary underline">Ver reserva</a> */}
            </div>
          ) : (
            <div className="text-gray-400">Sin reserva asociada</div>
          )}
        </div>

        {/* Fechas y estado */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-1 text-sm text-gray-500">Estado & fechas</div>
          <ul className="text-sm">
            <li><span className="text-gray-500">Estado:</span> <span className="font-medium">{task.status}</span></li>
            <li><span className="text-gray-500">Prioridad:</span> <span className="font-medium">{task.priority}</span></li>
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
