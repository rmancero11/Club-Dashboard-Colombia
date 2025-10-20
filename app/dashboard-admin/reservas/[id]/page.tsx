import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import EditReservationForm from "@/app/components/admin/reservations/EditReservationForm";
import UpdateReservationStatus from "@/app/components/admin/reservations/UpdateReservationStatus";

// --- Helpers solo UI ---
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
const RES_LABELS: Record<string, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  HOLD: "En espera",
  CONFIRMED: "Confirmada",
  TRAVELING: "En viaje",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
  EXPIRED: "Vencida",
};
const RES_PILL: Record<string, string> = {
  LEAD: "bg-gray-50 border-gray-200 text-gray-700",
  QUOTED: "bg-indigo-50 border-indigo-200 text-indigo-700",
  HOLD: "bg-amber-50 border-amber-200 text-amber-700",
  CONFIRMED: "bg-sky-50 border-sky-200 text-sky-700",
  TRAVELING: "bg-cyan-50 border-cyan-200 text-cyan-700",
  COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
  CANCELED: "bg-rose-50 border-rose-200 text-rose-700",
  EXPIRED: "bg-stone-50 border-stone-200 text-stone-700",
};
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO");
}
function fmtDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO");
}
function digitsOnly(s?: string | null) {
  return (s || "").replace(/\D/g, "");
}

// ---- Parser de timeline (notes como JSON) ----
function parseTimeline(
  raw?: string | null
): Array<{ ts: string; text: string; author?: string; type?: string }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => ({
        ts: typeof it?.ts === "string" ? it.ts : new Date().toISOString(),
        text: typeof it?.text === "string" ? it.text : "",
        author: typeof it?.author === "string" ? it.author : "Sistema",
        type: typeof it?.type === "string" ? it.type : "NOTE",
      }))
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  } catch {
    return [];
  }
}

export default async function AdminReservationDetailPage({
  params,
}: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");
  const businessId = auth.businessId!;

  const r = await prisma.reservation.findFirst({
    where: { id: params.id, businessId },
    select: {
      id: true,
      code: true,
      status: true,
      startDate: true,
      endDate: true,
      paxAdults: true,
      paxChildren: true,
      currency: true,
      totalAmount: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { id: true, name: true, email: true, phone: true } },
      seller: { select: { id: true, name: true } },
      destination: { select: { id: true, name: true, country: true } },
    },
  });
  if (!r) notFound();

  const [sellers, clients, destinations] = await Promise.all([
    prisma.user.findMany({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { businessId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.destination.findMany({
      where: { businessId },
      select: { id: true, name: true, country: true },
      orderBy: [{ popularityScore: "desc" }, { name: "asc" }],
      take: 300,
    }),
  ]);

  const pill = RES_PILL[r.status] || "bg-gray-50 border-gray-200 text-gray-700";
  const statusLabel = RES_LABELS[r.status] ?? r.status;
  const waDigits = digitsOnly(r.client?.phone);
  const waUrl = waDigits ? `https://wa.me/${waDigits}` : "";

  const timeline = parseTimeline(r.notes);

  return (
    <div className="space-y-6">
      {/* 🔒 Metas ocultas para que el componente cliente de estado lea fechas */}
      <meta id="res-start" content={r.startDate.toISOString()} />
      <meta id="res-end" content={r.endDate.toISOString()} />

      {/* Encabezado */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{r.code}</h1>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${pill}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {r.client?.name || "—"} · {r.destination?.name || "—"} ({r.destination?.country || "—"}) · {r.seller?.name || "—"}
          </p>
          <p className="text-xs text-gray-400">
            Creada: {fmtDateTime(r.createdAt)} · Actualizada: {fmtDateTime(r.updatedAt)}
          </p>
        </div>
        <a href="/dashboard-admin/reservas" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      {/* Resumen principal */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Estado</h2>
          <UpdateReservationStatus id={r.id} status={r.status as any} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Fechas del viaje</div>
              <div className="text-sm">
                {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Pasajeros</div>
              <div className="text-sm">
                {r.paxAdults} adultos / {r.paxChildren} niños
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Totales</h2>
          <div className="text-2xl font-semibold">
            {money(Number(r.totalAmount), r.currency)}{" "}
            <span className="text-sm text-gray-500">({r.currency})</span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>
              <span className="text-gray-500">Código: </span>
              <span className="font-medium">{r.code}</span>
            </li>
            <li>
              <span className="text-gray-500">Estado: </span>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${pill}`}>
                {statusLabel}
              </span>
            </li>
            <li>
              <span className="text-gray-500">Destino: </span>
              <a className="underline" href={`/dashboard-admin/destinos/${r.destination?.id}`}>
                {r.destination?.name || "—"}
              </a>{" "}
              <span className="text-xs text-gray-500">({r.destination?.country || "—"})</span>
            </li>
            <li>
              <span className="text-gray-500">Cliente: </span>
              <a className="underline" href={`/dashboard-admin/clientes/${r.client?.id}`}>{r.client?.name || "—"}</a>
            </li>
            <li>
              <span className="text-gray-500">Vendedor: </span>
              <a className="underline" href={`/dashboard-admin/usuarios/${r.seller?.id}`}>{r.seller?.name || "—"}</a>
            </li>
          </ul>
        </div>
      </section>

      {/* Contacto + Timeline */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Contacto del cliente</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-gray-500">Nombre: </span>
              <span className="font-medium">{r.client?.name || "—"}</span>
            </li>
            <li>
              <span className="text-gray-500">Correo: </span>
              {r.client?.email ? (
                <a className="text-blue-600 underline" href={`mailto:${r.client.email}`}>{r.client.email}</a>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">Teléfono: </span>
              {r.client?.phone ? (
                waUrl ? (
                  <a className="text-green-700 underline" target="_blank" href={waUrl} rel="noopener noreferrer" title="Abrir WhatsApp">
                    {r.client.phone}
                  </a>
                ) : (
                  <span className="text-gray-600">{r.client.phone}</span>
                )
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Timeline</h2>

          {/* Si había una nota en formato antiguo, la mostramos una vez */}
          {(!timeline.length && r.notes) ? (
            <div className="mb-3 rounded-lg border bg-amber-50 p-3 text-xs text-amber-800">
              {r.notes}
            </div>
          ) : null}

          {timeline.length === 0 ? (
            <div className="rounded-lg border p-3 text-sm text-gray-400">Sin eventos</div>
          ) : (
            <ol className="relative ml-3 border-l pl-4">
              {timeline.map((it, idx) => (
                <li key={`${it.ts}-${idx}`} className="mb-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-gray-300" />
                  <div className="text-xs text-gray-400">
                    {new Date(it.ts).toLocaleString("es-CO")} · {it.author || "Sistema"}
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
      </section>

      {/* Formulario de edición */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Editar reserva</h2>
        <EditReservationForm
          reservation={{
            id: r.id,
            sellerId: r.seller?.id || "",
            clientId: r.client?.id || "",
            destinationId: r.destination?.id || "",
            startDate: r.startDate.toISOString().slice(0, 10),
            endDate: r.endDate.toISOString().slice(0, 10),
            paxAdults: r.paxAdults,
            paxChildren: r.paxChildren,
            currency: r.currency,
            totalAmount: Number(r.totalAmount),
            notes: r.notes || "",
          }}
          sellers={sellers}
          clients={clients}
          destinations={destinations}
        />
      </section>
    </div>
  );
}
