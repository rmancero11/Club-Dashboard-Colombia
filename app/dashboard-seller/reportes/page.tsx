export default async function ReportesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-gray-500">Análisis y exportaciones.</p>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select className="rounded-md border px-3 py-2 text-sm">
            <option value="reservas">Reservas por estado</option>
            <option value="destinos">Top destinos</option>
            <option value="productividad">Productividad (tareas)</option>
          </select>
          <input type="month" className="rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md border px-3 py-2 text-sm">Exportar CSV</button>
        </div>

        <div className="h-64 grid place-items-center text-gray-400">[Gráfico / Tabla de reporte]</div>
      </div>
    </div>
  );
}
