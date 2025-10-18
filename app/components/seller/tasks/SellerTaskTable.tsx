"use client";

import { useRouter } from "next/navigation";

/* ===== Etiquetas por defecto (ES) ===== */
const STATUS_LABEL_DEFAULT: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
};

const STATUS_PILL: Record<string, string> = {
  OPEN: "bg-amber-50 border-amber-200 text-amber-700",
  IN_PROGRESS: "bg-sky-50 border-sky-200 text-sky-700",
  BLOCKED: "bg-rose-50 border-rose-200 text-rose-700",
  DONE: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const PRIORITY_LABEL_DEFAULT: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-red-600",
  URGENT: "text-red-700",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-CO");
}

export default function SellerTaskTable({
  tasks,
  priorityLabels,
  statusLabels,
}: {
  tasks: any[];
  /** Opcional: permite sobrescribir etiquetas desde el padre */
  priorityLabels?: Record<string, string>;
  statusLabels?: Record<string, string>;
}) {
  const router = useRouter();

  const PR_LABELS = { ...PRIORITY_LABEL_DEFAULT, ...(priorityLabels ?? {}) };
  const ST_LABELS = { ...STATUS_LABEL_DEFAULT, ...(statusLabels ?? {}) };

  if (!tasks.length)
    return <div className="text-gray-400 text-sm">Sin tareas registradas</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="border-b text-left text-gray-500">
          <tr>
            <th className="px-2 py-2">Título</th>
            <th className="px-2 py-2">Estado</th>
            <th className="px-2 py-2">Prioridad</th>
            <th className="px-2 py-2">Vencimiento</th>
            <th className="px-2 py-2">Reserva</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((t) => {
            const statusPill =
              STATUS_PILL[t.status] ?? "bg-gray-50 border-gray-200 text-gray-700";
            const priorityColor =
              PRIORITY_COLOR[t.priority] ?? "text-gray-600";
            const statusText = ST_LABELS[t.status] ?? t.status;
            const priorityText = PR_LABELS[t.priority] ?? t.priority;

            return (
              <tr
                key={t.id}
                className="cursor-pointer border-b hover:bg-gray-50"
                onClick={() => router.push(`/dashboard-seller/tareas/${t.id}`)}
              >
                <td className="px-2 py-2 font-medium text-gray-800">
                  {t.title}
                </td>

                <td className="px-2 py-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${statusPill}`}
                  >
                    {statusText}
                  </span>
                </td>

                <td className={`px-2 py-2 ${priorityColor}`}>
                  {priorityText}
                </td>

                <td className="px-2 py-2">{fmtDate(t.dueDate)}</td>

                <td className="px-2 py-2 text-gray-600">
                  {t.reservation ? (
                    <>
                      {t.reservation.code} ·{" "}
                      <span className="text-xs text-gray-500">
                        {t.reservation.destination?.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>

                <td className="px-2 py-2 text-right">
                  <a
                    href={`/dashboard-seller/tareas/${t.id}`}
                    className="text-primary underline text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
