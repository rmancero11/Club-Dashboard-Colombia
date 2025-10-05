export default async function ClientesPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-500">Gestiona tus clientes y sus datos.</p>
        </div>
        <a href="/dashboard-seller/clientes/nuevo" className="rounded-lg bg-black px-4 py-2 text-white">
          Nuevo cliente
        </a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre, email o teléfono"
          />
          <select className="rounded-md border px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="archived">Archivados</option>
            <option value="active">Activos</option>
          </select>
        </div>

        <div className="h-64 grid place-items-center text-gray-400">[Tabla de clientes]</div>
      </div>
    </div>
  );
}
