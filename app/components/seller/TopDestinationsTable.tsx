export default function TopDestinationsTable({ rows }: { rows: { name: string; count: number }[] }) {
  if (!rows.length) {
    return <div className="h-64 grid place-items-center text-gray-400">Sin datos</div>;
  }
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="px-2 py-2">Destino</th>
            <th className="px-2 py-2">Reservas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t">
              <td className="px-2 py-2">{r.name}</td>
              <td className="px-2 py-2">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
