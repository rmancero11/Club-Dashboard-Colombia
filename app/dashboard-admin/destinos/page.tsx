import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import ToggleActive from "@/app/components/admin/destinations/ToggleActive";
import Image from "next/image";

/* ========== Helpers UI ========== */
function toInt(v: string | string[] | undefined, def: number) {
  const n = Array.isArray(v) ? parseInt(v[0] || "", 10) : parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function qstr(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v != null && v !== "") usp.set(k, v);
  const s = usp.toString();
  return s ? `?${s}` : "";
}
const ORDER_OPTS = {
  createdAt_desc: [{ createdAt: "desc" }] as const,
  name_asc: [{ name: "asc" }] as const,
  popularity_desc: [
    { popularityScore: "desc" as const },
    { createdAt: "desc" as const },
  ],
};

export default async function AdminDestinationsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");
  const businessId = auth.businessId!;

  // Filtros (igual estilo Seller; en Admin no forzamos "yes")
  const q =
    (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const active =
    (Array.isArray(searchParams.active)
      ? searchParams.active[0]
      : searchParams.active) ?? "";
  const country =
    (Array.isArray(searchParams.country)
      ? searchParams.country[0]
      : searchParams.country) ?? "";
  const category =
    (Array.isArray(searchParams.category)
      ? searchParams.category[0]
      : searchParams.category) ?? "";
  const order =
    (Array.isArray(searchParams.order)
      ? searchParams.order[0]
      : searchParams.order) ?? "createdAt_desc";
  const page = toInt(searchParams.page, 1);
  const pageSize = Math.min(toInt(searchParams.pageSize, 10), 50);

  // Buscador por nombre + filtros
  const where: any = { businessId };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (active === "yes") where.isActive = true;
  if (active === "no") where.isActive = false;
  if (country) where.country = country;
  if (category) where.category = category;

  const [countries, categories] = await Promise.all([
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
  const countryOpts = (
    countries.map((c) => c.country).filter(Boolean) as string[]
  ).sort();
  const categoryOpts = (
    categories.map((c) => c.category).filter(Boolean) as string[]
  ).sort();

  const [total, items] = await Promise.all([
    prisma.destination.count({ where }),
    prisma.destination.findMany({
      where,
      orderBy: (ORDER_OPTS as any)[order] ?? ORDER_OPTS.createdAt_desc,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        category: true,
        price: true,
        discountPrice: true,
        isActive: true,
        popularityScore: true,
        createdAt: true,
        imageUrl: true,
        _count: { select: { reservations: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) {
    redirect(
      `/dashboard-admin/destinos${qstr({
        q,
        active,
        country,
        category,
        order,
        page: String(totalPages),
        pageSize: String(pageSize),
      })}`
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Destinos</h1>
          <p className="text-sm text-gray-500">
            Mostrando {items.length} de {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <a
          href="/dashboard-admin/destinos/nuevo"
          className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Nuevo destino
        </a>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-6">
        <form
          className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-7"
          method="GET"
        >
          <input
            name="q"
            defaultValue={q}
            className="w-full min-w-0 rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre del destino…"
          />
          <select
            name="country"
            defaultValue={country}
            className="w-full min-w-0 rounded-md border px-3 py-2 text-sm bg-white"
          >
            <option value="">País (todos)</option>
            {countryOpts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category}
            className="w-full min-w-0 rounded-md border px-3 py-2 text-sm bg-white"
          >
            <option value="">Categoría (todas)</option>
            {categoryOpts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="active"
            defaultValue={active}
            className="w-full min-w-0 rounded-md border px3 py-2 text-sm bg-white"
          >
            <option value="">Estado (todos)</option>
            <option value="yes">Activos</option>
            <option value="no">Inactivos</option>
          </select>
          <select
            name="order"
            defaultValue={order}
            className="w-full min-w-0 rounded-md border px-3 py-2 text-sm bg-white"
          >
            <option value="createdAt_desc">Más recientes</option>
            <option value="name_asc">Nombre (A–Z)</option>
            <option value="popularity_desc">Popularidad</option>
          </select>
          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="w-full min-w-0 rounded-md border px-3 py-2 text-sm bg-white"
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n} / pág.
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input type="hidden" name="page" value="1" />
            <button
              className="rounded-md border px-3 py-2 text-sm"
              type="submit"
            >
              Aplicar
            </button>
            <a
              className="rounded-md border px-3 py-2 text-sm"
              href={`/dashboard-admin/destinos${qstr({
                order: "createdAt_desc",
                page: "1",
                pageSize: String(pageSize),
              })}`}
            >
              Borrar filtros
            </a>
          </div>
        </form>

        {/* Tabla (estilo Seller) */}
        <div className="overflow-auto">
          <table className="table-fixed min-w-[720px] sm:min-w-[900px] text-sm">
            <colgroup>
              <col className="w-[40%] sm:w-[35%]" /> {/* Destino */}
              <col className="w-[28%] sm:w-[22%]" /> {/* Ubicación */}
              <col className="hidden sm:table-column w-[12%]" /> {/* Categoría */}
              <col className="w-[16%]" /> {/* Precio */}
              <col className="hidden md:table-column w-[10%]" /> {/* Reservas */}
              <col className="hidden lg:table-column w-[12%]" /> {/* Popularidad */}
              <col className="w-[12%]" /> {/* Acciones */}
            </colgroup>

            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Destino</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="hidden sm:table-cell px-2 py-2">Categoría</th>
                <th className="px-2 py-2">Precio</th>
                <th className="hidden md:table-cell px-2 py-2">Reservas</th>
                <th className="hidden lg:table-cell px-2 py-2">Popularidad</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-10 text-center text-gray-400"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}

              {items.map((d) => (
                <tr key={d.id} className="border-t align-top">
                  {/* DESTINO */}
                  <td className="px-2 py-2">
                    <div className="flex items-start gap-3">
                      {d.imageUrl && (
                        <Image
                          src={d.imageUrl}
                          alt={d.name}
                          className="h-12 w-12 shrink-0 rounded-md border object-cover"
                          width={150}
                          height={150}
                        />
                      )}
                      <div className="min-w-0 break-words">
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-gray-600">
                          Creado:{" "}
                          {new Date(d.createdAt).toLocaleDateString("es-CO")}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* UBICACIÓN */}
                  <td className="px-2 py-2 break-words">
                    {[d.city, d.country].filter(Boolean).join(", ") ||
                      d.country}
                  </td>

                  {/* CATEGORÍA (oculta en XS) */}
                  <td className="hidden sm:table-cell px-2 py-2 break-words">
                    {d.category || "—"}
                  </td>

                  {/* PRECIO (no cortar) */}
                  <td className="px-2 py-2 whitespace-nowrap">
                    {d.price != null &&
                      (d.discountPrice != null ? (
                        <div className="flex flex-col">
                          <span className="bg-gray-100 px-2 py-0.5 text-xs text-gray-500 line-through rounded-md">
                            ${Number(d.price).toLocaleString()}
                          </span>
                          <span className="mt-1 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                            ${Number(d.discountPrice).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                          ${Number(d.price).toLocaleString()}
                        </span>
                      ))}
                  </td>

                  {/* RESERVAS (md+) */}
                  <td className="hidden md:table-cell px-2 py-2 whitespace-nowrap">
                    {d._count.reservations}
                  </td>

                  {/* POPULARIDAD (lg+) */}
                  <td className="hidden lg:table-cell px-2 py-2 whitespace-nowrap">
                    {d.popularityScore}
                  </td>

                  {/* ACCIONES (Editar + Toggle activo) */}
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/dashboard-admin/destinos/${d.id}`}
                        className="text-primary underline"
                        title="Editar destino"
                      >
                        Editar
                      </a>
                      <ToggleActive id={d.id} isActive={d.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación (mismo estilo) */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-xs text-gray-500">
            Página {page} de {totalPages} — Mostrando{" "}
            {items.length > 0
              ? `${(page - 1) * pageSize + 1}–${
                  (page - 1) * pageSize + items.length
                }`
              : "0"}{" "}
            de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${
                page <= 1 ? "pointer-events-none opacity-50" : ""
              }`}
              href={
                page > 1
                  ? `/dashboard-admin/destinos${qstr({
                      q,
                      active,
                      country,
                      category,
                      order,
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
                  ? `/dashboard-admin/destinos${qstr({
                      q,
                      active,
                      country,
                      category,
                      order,
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
