import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

import EditDestinationForm from "@/app/components/admin/destinations/EditDestinationForm";
import ToggleActive from "@/app/components/admin/destinations/ToggleActive";
import DeleteDestinationButton from "@/app/components/admin/destinations/DeleteDestinationButton";

const asNumberOrEmpty = (v: any): number | "" => {
  if (v == null) return "";
  if (typeof v === "number") return v;
  if (typeof v?.toNumber === "function") return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

/** Formateo de dinero (resiliente) */
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    const safe = Number.isFinite(n) ? (n as number).toFixed(2) : String(n);
    return `${currency} ${safe}`;
  }
}

/** Tasa para convertir COP → USD (puedes setearla por env) */
const USD_COP_RATE = Number(
  process.env.NEXT_PUBLIC_USD_COP_RATE || process.env.USD_COP_RATE || 4000
);

/** Normaliza un monto a USD según su moneda original (para las reservas listadas) */
function toUSD(amount: number, currency?: string) {
  const c = (currency || "USD").toUpperCase().replace(/\s+/g, "");
  if (c === "COP" || c === "COP$" || c === "COL" || c === "COL$") {
    return amount / USD_COP_RATE;
  }
  return amount; // USD u otras ya consideradas en USD
}

/** Prisma Decimal -> number | null seguro */
const asNumber = (value: any): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toNumber === "function") return value.toNumber();
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export default async function AdminDestinationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  const d = await prisma.destination.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      country: true,
      city: true,
      description: true,
      imageUrl: true,
      isActive: true,
      popularityScore: true,
      membership: true, // STANDARD | PREMIUM | VIP

      // Precios nuevos
      priceUSDWithAirfare: true,
      priceUSDWithoutAirfare: true,
      priceCOPWithAirfare: true,
      priceCOPWithoutAirfare: true,
      baseFromUSD: true,
      baseFromCOP: true,

      listUSDWithAirfare: true,
      listUSDWithoutAirfare: true,
      listCOPWithAirfare: true,
      listCOPWithoutAirfare: true,
      discountUSDWithAirfarePercent: true,
      discountUSDWithoutAirfarePercent: true,
      discountCOPWithAirfarePercent: true,
      discountCOPWithoutAirfarePercent: true,

      // Categorías (M:N)
      categories: { select: { name: true, slug: true } },

      // Fechas de viaje (1:N)
      tripDates: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          isActive: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ startDate: "asc" }],
      },

      createdAt: true,
      updatedAt: true,
      _count: { select: { reservations: true } },
    },
  });

  if (!d) notFound();

  // Convertimos Decimals a number
  const usdWith = asNumber(d.priceUSDWithAirfare);
  const usdWithout = asNumber(d.priceUSDWithoutAirfare);
  const copWith = asNumber(d.priceCOPWithAirfare);
  const copWithout = asNumber(d.priceCOPWithoutAirfare);
  const fromUSD = asNumber(d.baseFromUSD);
  const fromCOP = asNumber(d.baseFromCOP);

  const recentReservations = await prisma.reservation.findMany({
    where: { destinationId: d.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      code: true,
      totalAmount: true, // Decimal
      currency: true, // "COP" | "USD" | ...
      status: true,
      client: { select: { name: true } },
      startDate: true,
      endDate: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{d.name}</h1>
          <p className="text-sm text-gray-500">
            {[d.city, d.country].filter(Boolean).join(", ") || d.country} ·
            Membresía: <strong>{d.membership}</strong>
          </p>
          {d.categories.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Categorías: {d.categories.map((c) => c.name).join(", ")}
            </p>
          )}
        </div>
        <a
          href="/dashboard-admin/destinos"
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info y edición */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Editar destino</h2>

          {/* IMPORTANTE: Actualiza EditDestinationForm para aceptar los nuevos campos */}
          <EditDestinationForm
            dest={{
              id: d.id,
              name: d.name,
              country: d.country,
              city: d.city ?? "",
              description: d.description ?? "",
              imageUrl: d.imageUrl ?? "",

              // Nuevo: membership y categorías (para chips/tags)
              membership: d.membership,
              categories: d.categories, // [{ name, slug }]

              priceUSDWithAirfare: asNumberOrEmpty(d.priceUSDWithAirfare),
              priceUSDWithoutAirfare: asNumberOrEmpty(d.priceUSDWithoutAirfare),
              priceCOPWithAirfare: asNumberOrEmpty(d.priceCOPWithAirfare),
              priceCOPWithoutAirfare: asNumberOrEmpty(d.priceCOPWithoutAirfare),

              listUSDWithAirfare: asNumberOrEmpty(d.listUSDWithAirfare),
              listUSDWithoutAirfare: asNumberOrEmpty(d.listUSDWithoutAirfare),
              listCOPWithAirfare: asNumberOrEmpty(d.listCOPWithAirfare),
              listCOPWithoutAirfare: asNumberOrEmpty(d.listCOPWithoutAirfare),

              discountUSDWithAirfarePercent: asNumberOrEmpty(
                d.discountUSDWithAirfarePercent
              ),
              discountUSDWithoutAirfarePercent: asNumberOrEmpty(
                d.discountUSDWithoutAirfarePercent
              ),
              discountCOPWithAirfarePercent: asNumberOrEmpty(
                d.discountCOPWithAirfarePercent
              ),
              discountCOPWithoutAirfarePercent: asNumberOrEmpty(
                d.discountCOPWithoutAirfarePercent
              ),

              baseFromUSD: asNumberOrEmpty(d.baseFromUSD),
              baseFromCOP: asNumberOrEmpty(d.baseFromCOP),

              tripDates: d.tripDates,
            }}
          />

          <div className="mt-3 flex gap-2">
            <ToggleActive id={d.id} isActive={d.isActive} />
            <DeleteDestinationButton id={d.id} />
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Popularidad: {d.popularityScore} · Creado:{" "}
            {new Date(d.createdAt).toLocaleString("es-CO")} · Actualizado:{" "}
            {new Date(d.updatedAt).toLocaleString("es-CO")}
          </div>

          {/* Resumen de precios */}
          <div className="mt-4 grid gap-2 text-sm">
            <div className="rounded-md border p-3">
              <div className="font-medium mb-1">Precios (USD)</div>
              <div className="text-gray-700">
                Sin aéreo:{" "}
                <strong>
                  {usdWithout != null ? money(usdWithout, "USD") : "—"}
                </strong>{" "}
                · Con aéreo:{" "}
                <strong>{usdWith != null ? money(usdWith, "USD") : "—"}</strong>
              </div>
              {fromUSD != null && (
                <div className="text-xs text-gray-500">
                  Desde: <strong>{money(fromUSD, "USD")}</strong>
                </div>
              )}
            </div>

            <div className="rounded-md border p-3">
              <div className="font-medium mb-1">Precios (COP)</div>
              <div className="text-gray-700">
                Sin aéreo:{" "}
                <strong>
                  {copWithout != null ? money(copWithout, "COP") : "—"}
                </strong>{" "}
                · Con aéreo:{" "}
                <strong>{copWith != null ? money(copWith, "COP") : "—"}</strong>
              </div>
              {fromCOP != null && (
                <div className="text-xs text-gray-500">
                  Desde: <strong>{money(fromCOP, "COP")}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Fechas de viaje (solo lectura rápida) */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Fechas de viaje</h3>
            {d.tripDates.length === 0 ? (
              <div className="text-xs text-gray-400">Sin fechas definidas</div>
            ) : (
              <ul className="grid gap-2">
                {d.tripDates.map((td) => (
                  <li key={td.id} className="rounded-md border p-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {new Date(td.startDate).toLocaleDateString("es-CO")} →{" "}
                        {new Date(td.endDate).toLocaleDateString("es-CO")}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 ${
                          td.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-50 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {td.isActive ? "Activa" : "Inactiva"}
                      </span>
                      {td.notes && (
                        <span className="text-gray-500">· {td.notes}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Reservas recientes */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Reservas recientes</h2>
          {recentReservations.length === 0 ? (
            <div className="text-gray-400">Sin reservas</div>
          ) : (
            <ul className="divide-y">
              {recentReservations.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {r.code} · {r.client?.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(r.startDate).toLocaleDateString("es-CO")} →{" "}
                        {new Date(r.endDate).toLocaleDateString("es-CO")} ·{" "}
                        {r.status}
                      </div>
                    </div>
                    <div className="text-sm">
                      {money(
                        toUSD(Number(r.totalAmount || 0), r.currency),
                        "USD"
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
