'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

type Props = {
  labels: string[];      // ["YYYY-MM", ...]
  values: number[];      // mismo largo que labels
  title?: string;
  subtitle?: string;
  months?: number;       // por defecto 6
};

function formatYm(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short' });
}

function lastN<T>(arr: T[], n: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(Math.max(0, arr.length - n));
}

export default function MonthlyLeadsChart({
  labels,
  values,
  title = 'Leads creados (mes a mes)',
  subtitle,
  months = 6,
}: Props) {
  const labelsN = lastN(labels, months);
  const valuesN = lastN(values, months);

  const data = labelsN.map((ym, i) => ({
    month: formatYm(ym),
    Leads: valuesN[i] ?? 0,
  }));

  const hasData = data.some(d => d.Leads > 0);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{subtitle ?? `últimos ${months} meses`}</span>
      </div>

      {!hasData ? (
        <div className="flex h-72 items-center justify-center text-sm text-gray-400">
          Sin datos para mostrar
        </div>
      ) : (
        <>
          <div className="h-[26rem]">{/* más alto para legibilidad */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 24, bottom: 48, left: 56 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-35}
                  textAnchor="end"
                  tickMargin={12}
                  interval={0}
                  height={56}
                />
                <YAxis
                  allowDecimals={false}
                  width={56}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Leads (conteo)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 12,
                    style: { fill: '#374151', fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [value as number, 'Leads']}
                  labelFormatter={(v) => v}
                  contentStyle={{ fontSize: 12 }}
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" height={24} />
                <Bar dataKey="Leads" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Eje X: meses (MMM AAAA). Eje Y: <span className="font-medium">número de leads creados</span>.
          </div>
        </>
      )}
    </div>
  );
}
