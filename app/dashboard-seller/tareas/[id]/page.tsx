import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import SellerTaskUpdateStatus from "@/app/components/seller/tasks/SellerTaskUpdateStatus";
import SellerTaskAddComment from "@/app/components/seller/tasks/SellerTaskAddComment";

/* === UI helpers, igual estilo a “reservas” === */
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
  CANCELLED: "Cancelada",
};
const STATUS_PILL: Record<string, string> = {
  OPEN: "bg-amber-50 border-amber-200 text-amber-700",
  IN_PROGRESS: "bg-sky-50 border-sky-200 text-sky-700",
  BLOCKED: "bg-rose-50 border-rose-200 text-rose-700",
  DONE: "bg-emerald-50 border-emerald-200 text-emerald-700",
  CANCELLED: "bg-stone-50 border-stone-200 text-stone-700",
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};
function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO");
}
function fmtDateTime(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO");
}

/** Timeline en Task.description como JSON: [{ ts, text, author, type }] */
function parseTimeline(raw?: string | null) {
  if (!raw) return { items: [] as any[], legacy: "" };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [], legacy: raw };
    const items = parsed
      .map((it) => ({
        ts: typeof it?.ts === "string" ? it.ts : new Date().toISOString(),
        text: typeof it?.text === "string" ? it.text : "",
        author: typeof it?.author === "string" ? it.author : "Sistema",
        type: typeof it?.type === "string" ? it.type : "NOTE",
      }))
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    return { items, legacy: "" };
  } catch {
    return { items: [], legacy: raw };
  }
}

export default async function SellerTaskDetailPage({
  params,
}: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  // Si es SELLER, solo puede ver sus tareas
  const where: any = {
    id: params.id,
    ...(auth.role !== "ADMIN" ? { sellerId: auth.userId } : {}),
  };

  const t = await prisma.task.findFirst({
    where,
    select: {
      id: true,
      title: true,
      description: true, // timeline JSON o texto
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      reservation: {
        select: {
          id: true,
          code: true,
          status: true,
          destination: { select: { name: true } },
          client: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });
  if (!t) notFound();

  const pill = STATUS_PILL[t.status] || "bg-gray-50 border-gray-200 text-gray-700";
  const statusLabel = STATUS_LABEL[t.status] ?? t.status;
  const prioLabel = PRIORITY_LABEL[t.priority] ?? t.priority;
  const timeline = parseTimeline(t.description);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${pill}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Prioridad: <span className="font-medium">{prioLabel}</span>
            {" · "}Vence: <span className="font-medium">{fmtDate(t.dueDate)}</span>
            {t.reservation ? (
              <>
                {" · "}
                <a
                  className="underline"
                  href={`/dashboard-seller/reservas/${t.reservation.id}`}
                  title="Ver reserva"
                >
                  {t.reservation.code}
                </a>{" "}
                <span className="text-xs text-gray-500">
                  · {t.reservation.destination?.name || "—"}
                </span>
              </>
            ) : null}
          </p>
          <p className="text-xs text-gray-400">
            Creada: {fmtDateTime(t.createdAt)} · Actualizada: {fmtDateTime(t.updatedAt)}
          </p>
        </div>
        <a href="/dashboard-seller/tareas" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      {/* Estado + Datos rápidos */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Estado</h2>
          <SellerTaskUpdateStatus id={t.id} status={t.status as any} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Vencimiento</div>
              <div className="text-sm">{fmtDate(t.dueDate)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Prioridad</div>
              <div className="text-sm">{prioLabel}</div>
            </div>
          </div>
        </div>

        {/* Contacto (si hay reserva->cliente) */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Contacto del cliente</h2>
          {t.reservation?.client ? (
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-500">Nombre: </span>
                <a
                  className="font-medium underline"
                  href={`/dashboard-seller/clientes/${t.reservation.client.id}`}
                >
                  {t.reservation.client.name || "—"}
                </a>
              </li>
              <li>
                <span className="text-gray-500">Correo: </span>
                {t.reservation.client.email ? (
                  <a className="text-blue-600 underline" href={`mailto:${t.reservation.client.email}`}>
                    {t.reservation.client.email}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </li>
              <li>
                <span className="text-gray-500">Teléfono: </span>
                <span className="text-gray-600">{t.reservation.client.phone || "—"}</span>
              </li>
            </ul>
          ) : (
            <div className="text-sm text-gray-400">Sin cliente asociado</div>
          )}
        </div>
      </section>

      {/* Timeline + Agregar comentario */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Timeline</h2>

          {/* Legacy: si existe texto viejo sin JSON, muéstralo una vez */}
          {(!timeline.items.length && timeline.legacy) ? (
            <div className="mb-3 rounded-lg border bg-amber-50 p-3 text-xs text-amber-800">
              {timeline.legacy}
            </div>
          ) : null}

          {timeline.items.length === 0 ? (
            <div className="rounded-lg border p-3 text-sm text-gray-400">Sin eventos</div>
          ) : (
            <ol className="relative ml-3 border-l pl-4">
              {timeline.items.map((it: any, idx: number) => (
                <li key={`${it.ts}-${idx}`} className="mb-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-gray-300" />
                  <div className="text-xs text-gray-400">
                    {fmtDateTime(it.ts)} · {it.author || "Sistema"}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    {it.type === "NOTE" ? "Nota" : it.type}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-800">{it.text || "—"}</div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Agregar comentario</h2>
          <SellerTaskAddComment taskId={t.id} />
        </div>
      </section>
    </div>
  );
}
