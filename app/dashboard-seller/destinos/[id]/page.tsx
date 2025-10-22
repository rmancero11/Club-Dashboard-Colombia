import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";

/* ===== Helpers UI ===== */
function money(n?: any) {
  if (n == null) return null;
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return `$${num.toLocaleString("es-CO")}`;
}
function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO");
}

export default async function SellerDestinationDetailPage({
  params,
}: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const destination = await prisma.destination.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
      category: true,
      description: true,
      price: true,
      discountPrice: true,
      isActive: true,
      popularityScore: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { reservations: true } },
    },
  });
  if (!destination) notFound();

  // Sugerencias de "similares" (mismo país o categoría)
  const related = await prisma.destination.findMany({
    where: {
      isActive: true,
      id: { not: destination.id },
      OR: [
        destination.country ? { country: destination.country } : undefined,
        destination.category ? { category: destination.category } : undefined,
      ].filter(Boolean) as any[],
    },
    select: {
      id: true,
      name: true,
      country: true,
      imageUrl: true,
      popularityScore: true,
      discountPrice: true,
      price: true,
    },
    orderBy: [{ popularityScore: "desc" }, { createdAt: "desc" }],
    take: 6,
  });

  const price = money(destination.price);
  const dprice = money(destination.discountPrice);
  const location =
    [destination.city, destination.country].filter(Boolean).join(", ") ||
    destination.country ||
    "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{destination.name}</h1>
          <p className="text-sm text-gray-500">
            {location} {destination.category ? `· ${destination.category}` : ""}
          </p>
          <p className="text-xs text-gray-400">
            Creado: {fmtDate(destination.createdAt)} · Actualizado:{" "}
            {fmtDate(destination.updatedAt)}
          </p>
        </div>
        <a href="/dashboard-seller/destinos" className="rounded-md border px-3 py-2 text-sm">
          ← Volver
        </a>
      </header>

      {/* Hero + Info */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Imagen / Descripción */}
        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          {destination.imageUrl ? (
            <div className="mb-4">
              <Image
                src={destination.imageUrl}
                alt={destination.name}
                className="h-64 w-full rounded-lg object-cover border"
                width={1200}
                height={600}
                priority
              />
            </div>
          ) : (
            <div className="mb-4 h-64 w-full rounded-lg border bg-gray-50 grid place-items-center text-gray-400 text-sm">
              Sin imagen
            </div>
          )}

          <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {destination.description || "—"}
          </div>

          {/* Tips de venta */}
          <div className="mt-6 rounded-lg border p-4">
            <h3 className="mb-2 text-sm font-semibold">Tips de venta</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {destination.category && (
                <li>
                  Enfatiza la experiencia de <strong>{destination.category}</strong> y personaliza el itinerario.
                </li>
              )}
              {destination.country && (
                <li>
                  Menciona highlights del país: <strong>{destination.country}</strong> (gastronomía, cultura, clima).
                </li>
              )}
              <li>Si hay tarifa promocional, muéstrala primero y crea urgencia (cupos limitados).</li>
              <li>Propón fechas sugeridas según temporada alta/baja y disponibilidad.</li>
              <li>Ofrece upsells: seguros, upgrades de hotel, traslados y actividades.</li>
            </ul>
          </div>
        </div>

        {/* Panel lateral de venta */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Detalle comercial</h2>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Precio</div>
              {price ? (
                destination.discountPrice != null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500 line-through">
                      {price}
                    </span>
                    <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                      {dprice}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white inline-block">
                    {price}
                  </div>
                )
              ) : (
                <div className="text-sm text-gray-400">—</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Popularidad</div>
                <div className="text-sm">{destination.popularityScore}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Reservas</div>
                <div className="text-sm">{destination._count.reservations}</div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Estado:{" "}
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${
                  destination.isActive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-stone-50 border-stone-200 text-stone-700"
                }`}
              >
                {destination.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="pt-2">
              <a
                href={`/dashboard-seller/reservas/nueva?destinationId=${destination.id}`}
                className={`rounded-md px-3 py-2 text-sm ${
                  destination.isActive ? "bg-black text-white" : "bg-gray-200 text-gray-500 pointer-events-none"
                }`}
                title={destination.isActive ? "Crear reserva" : "No disponible (inactivo)"}
              >
                Crear reserva
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Similares */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Similares</h2>
        {related.length === 0 ? (
          <div className="text-sm text-gray-400">Sin sugerencias</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((d) => (
              <div key={d.id} className="rounded-lg border overflow-hidden">
                <a href={`/dashboard-seller/destinos/${d.id}`} className="block">
                  {d.imageUrl ? (
                    <Image
                      src={d.imageUrl}
                      alt={d.name}
                      width={600}
                      height={400}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="h-32 w-full bg-gray-50 grid place-items-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                  <div className="p-3">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-gray-500">{d.country || "—"}</div>
                    <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                      <span>Pop: {d.popularityScore}</span>
                      {d.discountPrice != null ? (
                        <>
                          <span className="line-through text-gray-400">{money(d.price)}</span>
                          <span className="rounded bg-primary px-1.5 py-0.5 text-white">
                            {money(d.discountPrice)}
                          </span>
                        </>
                      ) : money(d.price) ? (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5">{money(d.price)}</span>
                      ) : null}
                    </div>
                  </div>
                </a>
                <div className="p-3 border-t flex items-center justify-between">
                  <a
                    href={`/dashboard-seller/destinos/${d.id}`}
                    className="text-sm underline text-gray-700"
                  >
                    Ver
                  </a>
                  <a
                    href={`/dashboard-seller/reservas/nueva?destinationId=${d.id}`}
                    className="text-sm underline text-primary"
                    title="Crear reserva"
                  >
                    Reservar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
