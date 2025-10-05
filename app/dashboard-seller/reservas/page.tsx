export default async function ReservasPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservas</h1>
          <p className="text-sm text-gray-500">Crea y gestiona reservas.</p>
        </div>
        <a href="/dashboard-seller/reservas/nueva" className="rounded-lg bg-black px-4 py-2 text-white">
          Nueva reserva
        </a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Buscar por código o cliente" />
          <select className="rounded-md border px-3 py-2 text-sm">
            <option value="">Estado</option>
            <option value="DRAFT">Borrador</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="CANCELED">Cancelada</option>
            <option value="COMPLETED">Completada</option>
          </select>
          <input type="date" className="rounded-md border px-3 py-2 text-sm" />
          <input type="date" className="rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="h-64 grid place-items-center text-gray-400">[Tabla de reservas]</div>
      </div>
    </div>
  );
}
