type Props = {
  labels: string[]; // e.g. ["2025-01", ...]
  values: number[]; // mismo largo que labels
};

export default function Sparkline({ labels, values }: Props) {
  const width = 800;
  const height = 220;
  const padding = 32;

  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);

  const x = (i: number) => {
    const n = Math.max(1, values.length - 1);
    return padding + (i * (width - padding * 2)) / n;
  };
  const y = (v: number) => {
    if (max === min) return height - padding;
    return padding + (height - padding * 2) * (1 - (v - min) / (max - min));
  };

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      {/* grid base */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E5E7EB" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#E5E7EB" />

      {/* área */}
      <polyline
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="rgba(59,130,246,0.1)" // azul suave
        stroke="none"
      />
      {/* línea */}
      <polyline
        points={points}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ticks (cada 2 meses) */}
      {labels.map((lab, i) => (
        i % 2 === 0 ? (
          <text key={lab} x={x(i)} y={height - padding + 16} fontSize="10" textAnchor="middle" fill="#6B7280">
            {lab.slice(2)}{/* muestra YY-MM */}
          </text>
        ) : null
      ))}

      {/* max label */}
      <text x={width - padding} y={padding - 8} fontSize="10" textAnchor="end" fill="#6B7280">
        Máx: {max}
      </text>
    </svg>
  );
}
