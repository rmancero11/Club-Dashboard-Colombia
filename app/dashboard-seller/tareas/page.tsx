import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import SellerTaskTable from "@/app/components/seller/tasks/SellerTaskTable";

/* Etiquetas en español (ajústalas a tus enums reales si difieren) */
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "Pendiente",
  IN_PROGRESS: "En progreso",
  DONE: "Completada",
  CANCELED: "Cancelada",
  BLOCKED: "Bloqueada",
};

export default async function SellerTasksPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.businessId) redirect("/unauthorized");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const sellerId = auth.userId!;

  // Solo tareas del vendedor (o todas si es ADMIN)
  const tasks = await prisma.task.findMany({
    where: {
      businessId,
      ...(auth.role !== "ADMIN" ? { sellerId } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      reservation: {
        select: {
          id: true,
          code: true,
          destination: { select: { name: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    take: 300,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tareas</h1>
          <p className="text-sm text-gray-500">Tus tareas pendientes y completadas</p>
        </div>
        <a
          href="/dashboard-seller/tareas/nueva"
          className="rounded-md border px-3 py-2 text-sm"
        >
          + Nueva tarea
        </a>
      </header>

      <section className="rounded-xl border bg-white p-4">
        {/* Pasa diccionarios para mostrar etiquetas en ES */}
        <SellerTaskTable
          tasks={tasks}
          priorityLabels={PRIORITY_LABELS}
          statusLabels={STATUS_LABELS}
        />
      </section>
    </div>
  );
}
