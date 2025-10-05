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

export default async function DestinosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "SELLER" && auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const status = (Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) ?? ""; // "", "active", "inactive"
  const country = (Array.isArray(searchParams.country) ? searchParams.country[0] : searchParams.country) ?? "";
  const category = (Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category) ?? "";
  const page = toInt(searchParams.page, 1);
  const pageSizeRaw = toInt(searchParams.pageSize, 10);
  const pageSize = Math.min(pageSizeRaw, 50);

  const where: any = { businessId };

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (country) where.country = { equals: country, mode: "insensitive" };
  if (category) where.category = { equals: category, mode: "insensitive" };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // opciones de filtros (distinct)
  const [countryRows, categoryRows] = await Promise.all([
    prisma.destination.findMany({
      where: { businessId },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
    prisma.destination.findMany({
      where: { businessId },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);
  const countries = countryRows.map(r => r.country).filter(Boolean) as string[];
  const categories = categoryRows.map(r => r.category).filter(Boolean) as string[];

  const [total, items] = await Promise.all([
    prisma.destination.count({ where }),
    prisma.destination.findMany({
      where,
      orderBy: [{ popularityScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        category: true,
        isActive: true,
        popularityScore: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    const qs = qstr({ q, status, country, category, page: String(safePage), pageSize: String(pageSize) });
    redirect(`/dashboard-seller/destinos${qs}`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Destinos</h1>
          <p className="text-sm text-gray-500">
            Gestiona los destinos de tu empresa. Mostrando {items.length} de {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <a href="/dashboard-seller/destinos/nuevo" className="rounded-lg bg-black px-4 py-2 text-white">
          Nuevo destino
        </a>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-4">
        <form className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-5" method="GET">
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre, país, ciudad..."
          />
          <select name="status" defaultValue={status} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select name="country" defaultValue={country} className="rounded-md border px-3 py-2 text-sm">
            <option value="">País</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="category" defaultValue={category} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Categoría</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} / pág.</option>)}
            </select>
            <button className="whitespace-nowrap rounded-md border px-3 py-2 text-sm" type="submit">
              Aplicar
            </button>
          </div>
          <input type="hidden" name="page" value="1" />
        </form>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Nombre</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="px-2 py-2">Categoría</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Popularidad</th>
                <th className="px-2 py-2">Creado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-10 text-center text-gray-400">Sin resultados</td>
                </tr>
              )}
              {items.map(d => (
                <tr key={d.id} className="border-top border-t">
                  <td className="px-2 py-2 font-medium">{d.name}</td>
                  <td className="px-2 py-2">{[d.city, d.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-2 py-2">{d.category || "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      d.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-100 text-gray-600"
                    }`}>
                      {d.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-2 py-2">{d.popularityScore}</td>
                  <td className="px-2 py-2">{formatDate(d.createdAt)}</td>
                  <td className="px-2 py-2 text-right">
                    <a href={`/dashboard-seller/destinos/${d.id}`} className="text-primary underline">Ver</a>
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
            {items.length > 0 ? `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + items.length}` : "0"}
            {" "}de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              href={
                page > 1
                  ? `/dashboard-seller/destinos${qstr({ q, status, country, category, page: String(page - 1), pageSize: String(pageSize) })}`
                  : "#"
              }
            >
              ← Anterior
            </a>
            <a
              aria-disabled={page >= totalPages}
              className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              href={
                page < totalPages
                  ? `/dashboard-seller/destinos${qstr({ q, status, country, category, page: String(page + 1), pageSize: String(pageSize) })}`
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
