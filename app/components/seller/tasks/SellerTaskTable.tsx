"use client";

import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
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
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-red-600",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-CO");
}

export default function SellerTaskTable({ tasks }: { tasks: any[] }) {
  const router = useRouter();

  if (!tasks.length)
    return <div className="text-gray-400 text-sm">Sin tareas registradas</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="py-2 px-2">Título</th>
            <th className="py-2 px-2">Estado</th>
            <th className="py-2 px-2">Prioridad</th>
            <th className="py-2 px-2">Vencimiento</th>
            <th className="py-2 px-2">Reserva</th>
            <th className="py-2 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr
              key={t.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/dashboard-seller/tareas/${t.id}`)}
            >
              <td className="py-2 px-2 font-medium text-gray-800">
                {t.title}
              </td>
              <td className="py-2 px-2">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${STATUS_PILL[t.status] || ""}`}
                >
                  {STATUS_LABEL[t.status] || t.status}
                </span>
              </td>
              <td className={`py-2 px-2 ${PRIORITY_COLOR[t.priority]}`}>
                {t.priority}
              </td>
              <td className="py-2 px-2">{fmtDate(t.dueDate)}</td>
              <td className="py-2 px-2 text-gray-600">
                {t.reservation ? (
                  <>
                    {t.reservation.code} ·{" "}
                    <span className="text-xs text-gray-500">
                      {t.reservation.destination?.name}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
              <td className="py-2 px-2 text-right">
                <a
                  href={`/dashboard-seller/tareas/${t.id}`}
                  className="text-primary underline text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
