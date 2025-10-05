import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

// helpers
function toInt(v: string | string[] | undefined, def: number) {
  const n = Array.isArray(v) ? parseInt(v[0] || "", 10) : parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function qstr(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "SELLER" && auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const sellerId = auth.userId;

  // filtros desde la URL
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const status = (Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) ?? ""; // "", "active", "archived"
  const page = toInt(searchParams.page, 1);
  const pageSizeRaw = toInt(searchParams.pageSize, 10);
  const pageSize = Math.min(pageSizeRaw, 50);

  const where: any = {
    businessId,
    sellerId, // 👈 El vendedor solo ve sus clientes
  };

  if (status === "active") where.isArchived = false;
  if (status === "archived") where.isArchived = true;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { documentId: { contains: q, mode: "insensitive" } },
      { tags: { has: q } }, // coincide si q está tal cual entre las tags
    ];
  }

  const [total, items] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        isArchived: true,
        createdAt: true,
        tags: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  // Si la página pedida excede, redirige a la última válida conservando filtros.
  if (safePage !== page) {
    const qs = qstr({ q, status, page: String(safePage), pageSize: String(pageSize) });
    redirect(`/dashboard-seller/clientes${qs}`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-500">
            Gestiona tus clientes. Mostrando {items.length} de {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <a href="/dashboard-seller/clientes/nuevo" className="rounded-lg bg-black px-4 py-2 text-white">
          Nuevo cliente
        </a>
      </header>

      {/* Filtros (GET puro, sin JS) */}
      <div className="rounded-xl border bg-white p-4">
        <form className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3" method="GET">
          <input
            name="q"
            defaultValue={q}
            className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre, email, teléfono..."
          />
          <select
            name="status"
            defaultValue={status}
            className="w-full max-w-[180px] rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="archived">Archivados</option>
          </select>
          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="w-full max-w-[120px] rounded-md border px-3 py-2 text-sm"
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n} / pág.
              </option>
            ))}
          </select>
          <input type="hidden" name="page" value="1" />
          <button className="rounded-md border px-3 py-2 text-sm" type="submit">
            Aplicar
          </button>
        </form>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Nombre</th>
                <th className="px-2 py-2">Contacto</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="px-2 py-2">Tags</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Creado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-10 text-center text-gray-400">
                    Sin resultados
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-2 font-medium">{c.name}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      {c.email && <span className="text-xs text-gray-600">{c.email}</span>}
                      {c.phone && <span className="text-xs text-gray-600">{c.phone}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || []).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700"
                        >
                          {t}
                        </span>
                      ))}
                      {(!c.tags || c.tags.length === 0) && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        c.isArchived
                          ? "border-gray-200 bg-gray-100 text-gray-600"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {c.isArchived ? "Archivado" : "Activo"}
                    </span>
                  </td>
                  <td className="px-2 py-2">{formatDate(c.createdAt)}</td>
                  <td className="px-2 py-2 text-right">
                    <a
                      href={`/dashboard-seller/clientes/${c.id}`}
                      className="text-primary underline"
                    >
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-xs text-gray-500">
            Página {page} de {totalPages} — Mostrando{" "}
            {items.length > 0
              ? `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + items.length}`
              : "0"}
            {" "}de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${
                page <= 1 ? "pointer-events-none opacity-50" : ""
              }`}
              href={
                page > 1
                  ? `/dashboard-seller/clientes${qstr({
                      q,
                      status,
                      page: String(page - 1),
                      pageSize: String(pageSize),
                    })}`
                  : "#"
              }
            >
              ← Anterior
            </a>
            <a
              aria-disabled={page >= totalPages}
              className={`rounded-md border px-3 py-2 text-sm ${
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }`}
              href={
                page < totalPages
                  ? `/dashboard-seller/clientes${qstr({
                      q,
                      status,
                      page: String(page + 1),
                      pageSize: String(pageSize),
                    })}`
                  : "#"
              }
            >
              Siguiente →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
