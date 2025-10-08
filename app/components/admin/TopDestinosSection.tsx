import prisma from "@/app/lib/prisma";

export default async function TopDestinosSection({ businessId }: { businessId: string }) {
  const rows = await prisma.$queryRaw<{
    name: string;
    city: string | null;
    country: string;
    leads: bigint;
    confirmed: bigint;
  }[]>`
    SELECT
      d."name" AS name,
      d."city" AS city,
      d."country" AS country,
      COUNT(r.*)::bigint AS leads,
      COUNT(*) FILTER (WHERE r."status" = 'CONFIRMED')::bigint AS confirmed
    FROM "Reservation" r
    JOIN "Destination" d ON d."id" = r."destinationId"
    WHERE r."businessId" = ${businessId}
    GROUP BY d."name", d."city", d."country"
    ORDER BY leads DESC
    LIMIT 10
  `;

  const data = rows.map((r) => {
    const leads = Number(r.leads);
    const confirmed = Number(r.confirmed);
    const rate = leads > 0 ? (confirmed / leads) * 100 : 0;
    return {
      name: r.name,
      subtitle: `${r.city ? `${r.city} · ` : ""}${r.country}`,
      leads,
      confirmed,
      rate,
    };
  });

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top destinos: interés vs confirmadas</h2>
        <span className="text-xs text-gray-500">máx. 10 destinos por volumen de interés</span>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2">Destino</th>
              <th className="px-2 py-2">Interés (leads)</th>
              <th className="px-2 py-2">Confirmadas</th>
              <th className="px-2 py-2">Conversión</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-10 text-center text-gray-400">
                  Sin datos
                </td>
              </tr>
            )}
            {data.map((r) => {
              const rateColor =
                r.rate >= 35
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : r.rate >= 15
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-rose-700 bg-rose-50 border-rose-200";

              return (
                <tr key={`${r.name}-${r.subtitle}`} className="border-t">
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-gray-600">{r.subtitle}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2">{r.leads.toLocaleString("es-CO")}</td>
                  <td className="px-2 py-2">{r.confirmed.toLocaleString("es-CO")}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${rateColor}`}>
                      {r.rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        <span className="font-medium">Interés</span> = total de leads creados por destino.{" "}
        <span className="font-medium">Conversión</span> = confirmadas / leads.
      </p>
    </section>
  );
}
