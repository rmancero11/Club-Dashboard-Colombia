import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import SellerTaskTable from "@/app/components/seller/tasks/SellerTaskTable";

/* Etiquetas en español según los enums actuales */
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
  CANCELLED: "Cancelada",
};

export default async function SellerTasksPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const sellerId = auth.userId!;

  // Tareas del vendedor si es SELLER; todas si es ADMIN
  const tasks = await prisma.task.findMany({
    where: auth.role !== "ADMIN" ? { sellerId } : {},
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
        <SellerTaskTable
          tasks={tasks}
          priorityLabels={PRIORITY_LABELS}
          statusLabels={STATUS_LABELS}
        />
      </section>
    </div>
  );
}
