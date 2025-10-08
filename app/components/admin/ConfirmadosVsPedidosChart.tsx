'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type Props = {
  labels: string[];              // ["YYYY-MM", ...] 12 meses
  confirmed: number[];           // mismo largo que labels
  lost: number[];                // mismo largo que labels
  title?: string;
  subtitle?: string;
};

function formatYm(ym: string) {
  // "YYYY-MM" -> "MMM YYYY" en es-CO
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short' });
}

export default function ConfirmadosVsPerdidosChart({
  labels,
  confirmed,
  lost,
  title = 'Confirmados vs Perdidos',
  subtitle = 'últimos 12 meses',
}: Props) {
  const data = labels.map((ym, i) => ({
    month: formatYm(ym),
    Confirmados: confirmed[i] ?? 0,
    Perdidos: lost[i] ?? 0,
  }));

  const hasData = data.some(d => d.Confirmados > 0 || d.Perdidos > 0);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>

      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          Sin datos para mostrar
        </div>
      ) : (
        <>
          <div className="h-96">{/* altura mayor para legibilidad */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 24, bottom: 40, left: 56 }} // más espacio para ejes
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  // Evita solapamiento: rotación, margen y gap mínimo
                  angle={-35}
                  textAnchor="end"
                  tickMargin={12}
                  minTickGap={8}
                  interval={0} // muestra todos los meses
                  height={50}
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
                  formatter={(value: any) => [value as number, '']}
                  labelFormatter={(v) => v}
                  contentStyle={{ fontSize: 12 }}
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  verticalAlign="top"
                  height={24}
                />

                {/* Verde = confirmados, Rojo = perdidos */}
                <Line
                  type="monotone"
                  dataKey="Confirmados"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Perdidos"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Aclara ejes para el usuario */}
          <div className="mt-2 text-xs text-gray-500">
            Eje X: meses (MMM AAAA). Eje Y: <span className="font-medium">número de leads</span>
            — líneas: <span className="text-emerald-700 font-medium">Confirmados</span> vs{" "}
            <span className="text-rose-700 font-medium">Perdidos</span> (Cancelados + Expirados).
          </div>
        </>
      )}
    </div>
  );
}
