export default async function DestinosPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Destinos</h1>
          <p className="text-sm text-gray-500">Administra los destinos disponibles.</p>
        </div>
        <a href="/dashboard-seller/destinos/nuevo" className="rounded-lg bg-black px-4 py-2 text-white">
          Nuevo destino
        </a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input className="w-full max-w-xs rounded-md border px-3 py-2 text-sm" placeholder="Buscar por nombre, país o ciudad" />
          <select className="rounded-md border px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <div className="h-64 grid place-items-center text-gray-400">[Tabla de destinos]</div>
      </div>
    </div>
  );
}
