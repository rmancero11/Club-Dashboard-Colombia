import prisma from "@/app/lib/prisma";
import MonthlyReservationsChart from "@/app/components/seller/MonthlyReservationChart";

// Util: primer día del mes (00:00)
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
// Util: hace N meses (ajustado a primer día)
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Props = {
  businessId: string;
  sellerId: string;
  months?: number; // default 6
  title?: string;
  subtitle?: string;
};

export default async function ReservationTrend({
  businessId,
  sellerId,
  months = 6,
  title = "Reservas por mes",
  subtitle,
}: Props) {
  const rangeStart = monthsAgo(months - 1);

  // Serie agregada por mes
  const rawSeries = await prisma.$queryRaw<{ ym: string; count: bigint }[]>`
    SELECT to_char(date_trunc('month', "startDate"), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM "Reservation"
    WHERE "businessId" = ${businessId}
      AND "sellerId" = ${sellerId}
      AND "startDate" >= ${rangeStart}
    GROUP BY 1
    ORDER BY 1
  `;

  // Normaliza a N meses continuos (YYYY-MM)
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = monthsAgo(i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    labels.push(ym);
    const found = rawSeries.find((r) => r.ym === ym);
    values.push(found ? Number(found.count) : 0);
  }

  return (
    <MonthlyReservationsChart
      labels={labels}
      values={values}
      title={title}
      subtitle={subtitle ?? `Últimos ${months} meses`}
      months={months}
    />
  );
}
