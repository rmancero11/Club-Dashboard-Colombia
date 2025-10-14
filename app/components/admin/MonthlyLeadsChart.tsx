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
import { useEffect, useMemo, useState } from 'react';

type Props = {
  labels: string[];
  values: number[];
  title?: string;
  subtitle?: string;
  months?: number;
};

// --- Helpers ---
function formatMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString('es-CO', { month: 'short' });
}
function lastN<T>(arr: T[], n: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(Math.max(0, arr.length - n));
}

// --- Breakpoints unificados ---
function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 640px)');
    const mqTablet = window.matchMedia('(min-width: 641px) and (max-width: 1024px)');
    const update = () => {
      if (mqMobile.matches) setBp('mobile');
      else if (mqTablet.matches) setBp('tablet');
      else setBp('desktop');
    };
    update();
    mqMobile.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    return () => {
      mqMobile.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
    };
  }, []);
  return bp;
}

export default function MonthlyLeadsChart({
  labels,
  values,
  title = 'Leads creados',
  subtitle,
  months = 6,
}: Props) {
  const bp = useBreakpoint();

  // Mismas dimensiones/estilos que la otra gráfica
  const {
    chartHeight,
    margin,
    xTickAngle,
    xTickAnchor,
    xTickHeight,
    yTickFontSize,
    showLegend,
    barCategoryGap,
    barGap,
    barSize,
  } = useMemo(() => {
    if (bp === 'mobile') {
      return {
        chartHeight: 260,
        margin: { top: 10, right: 24, bottom: 30, left: 24 },
        xTickAngle: 0 as const,
        xTickAnchor: 'middle' as const,
        xTickHeight: 22,
        yTickFontSize: 11,
        showLegend: false,
        barCategoryGap: '20%',
        barGap: 2,
        barSize: 18,
      };
    }
    if (bp === 'tablet') {
      return {
        chartHeight: 320,
        margin: { top: 8, right: 16, bottom: 40, left: 48 },
        xTickAngle: -25 as const,
        xTickAnchor: 'end' as const,
        xTickHeight: 40,
        yTickFontSize: 12,
        showLegend: true,
        barCategoryGap: '18%',
        barGap: 4,
        barSize: 22,
      };
    }
    // desktop
    return {
      chartHeight: 380,
      margin: { top: 10, right: 24, bottom: 48, left: 56 },
      xTickAngle: -30 as const,
      xTickAnchor: 'end' as const,
      xTickHeight: 48,
      yTickFontSize: 12,
      showLegend: true,
      barCategoryGap: '16%',
      barGap: 6,
      barSize: 24,
    };
  }, [bp]);

  // Recorte defensivo
  const labelsN = lastN(labels, months);
  const valuesN = lastN(values, months);
  const len = Math.min(labelsN.length, valuesN.length);
  const safeLabels = labelsN.slice(-len);
  const safeValues = valuesN.slice(-len);

  const data = useMemo(
    () =>
      safeLabels.map((ym, i) => ({
        monthRaw: ym,
        month: formatMonth(ym),
        Leads: Number.isFinite(safeValues[i]) ? (safeValues[i] ?? 0) : 0,
      })),
    [safeLabels, safeValues]
  );

  const hasData = data.some(d => (d.Leads ?? 0) > 0);

  return (
    <div className="rounded-xl border bg-white p-4" role="group" aria-label="Gráfico de barras de leads por mes">
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{subtitle ?? `Últimos ${months} meses`}</span>
      </div>

      {!hasData ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400" aria-live="polite">
          Sin datos para mostrar
        </div>
      ) : (
        <>
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={margin} barCategoryGap={barCategoryGap} barGap={barGap}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={xTickAngle}
                  textAnchor={xTickAnchor}
                  interval={0}
                  height={xTickHeight}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  width={Math.max(36, (margin as any).left - 8)}
                  tick={{ fontSize: yTickFontSize }}
                  label={{
                    value: 'Leads',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    style: { fill: '#374151', fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [value as number, 'Leads']}
                  labelFormatter={(v, payload) => {
                    const p = Array.isArray(payload) ? payload[0] : undefined;
                    const raw = p?.payload?.monthRaw as string | undefined;
                    return raw ? formatMonth(raw) : (v as string);
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                  wrapperStyle={{ outline: 'none' }}
                />
                {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" height={24} />}
                <Bar dataKey="Leads" name="Leads" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={barSize} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Eje X: meses. Eje Y: <span className="font-medium">número de leads creados</span>.
          </div>
        </>
      )}
    </div>
  );
}
