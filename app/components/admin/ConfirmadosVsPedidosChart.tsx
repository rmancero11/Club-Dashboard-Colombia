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
  labels: string[];        // ["YYYY-MM", ...]
  confirmed: number[];     // misma longitud que labels
  lost: number[];          // misma longitud que labels
  title?: string;
  subtitle?: string;
  months?: number;         // por defecto 6
};

function formatMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
}

function lastN<T>(arr: T[], n: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(Math.max(0, arr.length - n));
}

export default function ConfirmadosVsPerdidosChart({
  labels,
  confirmed,
  lost,
  title = 'Reservas: Confirmadas vs Perdidas',
  subtitle,
  months = 6,
}: Props) {
  // recorte defensivo
  const lN = lastN(labels, months);
  const cN = lastN(confirmed, months);
  const pN = lastN(lost, months);
  const len = Math.min(lN.length, cN.length, pN.length);
  const L = lN.slice(-len), C = cN.slice(-len), P = pN.slice(-len);

  const data = L.map((ym, i) => ({
    month: formatMonth(ym),          // solo mes
    Confirmadas: C[i] ?? 0,
    Perdidas: P[i] ?? 0,
  }));

  const hasData = data.some(d => (d.Confirmadas ?? 0) > 0 || (d.Perdidas ?? 0) > 0);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">
          {subtitle ?? `Últimos ${months} meses`}
        </span>
      </div>

      {!hasData ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400">
          Sin datos para mostrar
        </div>
      ) : (
        <>
          <div className="w-full h-[320px] sm:h-[360px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 24, bottom: 40, left: 48 }}
                barCategoryGap="18%"
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  interval={0}
                  height={32}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  width={48}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Reservas',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    style: { fill: '#374151', fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(v: any, name: any) => [v as number, name]}
                  labelFormatter={(v) => v as string}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" height={24} />
                <Bar dataKey="Confirmadas" name="Confirmadas" fill="#3B82F6" radius={[6,6,0,0]} />
                <Bar dataKey="Perdidas" name="Perdidas" fill="#F87171" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Eje X: meses. Eje Y: <span className="font-medium">número de reservas</span>.
          </div>
        </>
      )}
    </div>
  );
}
