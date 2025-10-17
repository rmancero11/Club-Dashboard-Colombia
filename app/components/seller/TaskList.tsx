type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  status: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  reservationId: string | null;
};

// Formateador de fecha (localización: Colombia)
function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

// Traducción de prioridades y estilos
function priorityBadge(p: Task["priority"]) {
  const map: Record<Task["priority"], string> = {
    LOW: "bg-gray-100 text-gray-700 border-gray-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    HIGH: "bg-red-100 text-red-700 border-red-200",
  };
  const labelMap: Record<Task["priority"], string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${map[p]}`}
    >
      Prioridad {labelMap[p]}
    </span>
  );
}

// Traducción de estados (por si luego se muestran)
const statusLabels: Record<Task["status"], string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
  CANCELLED: "Cancelada",
};

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) {
    return (
      <div className="h-40 grid place-items-center text-gray-400">
        No tienes tareas pendientes
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-start gap-3 py-3">
          <div className="mt-1 text-xs text-gray-500 w-14 shrink-0">
            {fmtDate(t.dueDate)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{t.title}</span>
              {priorityBadge(t.priority)}
              {t.reservationId && (
                <a
                  href={`/dashboard-seller/reservas/${t.reservationId}`}
                  className="text-xs text-primary underline"
                >
                  Ver reserva
                </a>
              )}
            </div>
            {t.description && (
              <p className="text-sm text-gray-600">{t.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
