import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";

function toInt(v: string | string[] | undefined, def: number) {
  const n = Array.isArray(v) ? parseInt(v[0] || "", 10) : parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function qstr(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && usp.set(k, v));
  const s = usp.toString();
  return s ? `?${s}` : "";
}
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function AdminClientsPage({
  searchParams,
}: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");
  const businessId = auth.businessId!;

  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const sellerId = (Array.isArray(searchParams.sellerId) ? searchParams.sellerId[0] : searchParams.sellerId) ?? "";
  const archived = (Array.isArray(searchParams.archived) ? searchParams.archived[0] : searchParams.archived) ?? ""; // "", active, archived
  const country = (Array.isArray(searchParams.country) ? searchParams.country[0] : searchParams.country) ?? "";
  const page = toInt(searchParams.page, 1);
  const pageSize = Math.min(toInt(searchParams.pageSize, 10), 50);

  const where: any = { businessId };
  if (sellerId) where.sellerId = sellerId;
  if (archived === "active") where.isArchived = false;
  if (archived === "archived") where.isArchived = true;
  if (country) where.country = country;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { documentId: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { tags: { has: q } }, // coincide tag exacto
    ];
  }

  // opciones de filtros
  const [sellers, countries] = await Promise.all([
    prisma.user.findMany({
      where: { businessId, role: "SELLER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }],
    }),
    prisma.client.findMany({
      where: { businessId },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
  ]);
  const countryOpts = countries.map(c => c.country).filter(Boolean) as string[];

  const [total, items] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, name: true, email: true, phone: true, country: true, city: true,
        documentId: true, isArchived: true, createdAt: true, tags: true,
        seller: { select: { id: true, name: true } },
        _count: { select: { reservations: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    redirect(`/dashboard-admin/clientes${qstr({ q, sellerId, archived, country, page: String(safePage), pageSize: String(pageSize) })}`);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-500">
            Mostrando {items.length} de {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard-admin/vendedores" className="rounded-lg border px-4 py-2">Ver vendedores</a>
        </div>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <form className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-6" method="GET">
          <input name="q" defaultValue={q} className="rounded-md border px-3 py-2 text-sm" placeholder="Nombre, email, doc, ciudad..." />
          <select name="sellerId" defaultValue={sellerId} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Vendedor (todos)</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
          </select>
          <select name="archived" defaultValue={archived} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Estado (todos)</option>
            <option value="active">Activos</option>
            <option value="archived">Archivados</option>
          </select>
          <select name="country" defaultValue={country} className="rounded-md border px-3 py-2 text-sm">
            <option value="">País (todos)</option>
            {countryOpts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="pageSize" defaultValue={String(pageSize)} className="rounded-md border px-3 py-2 text-sm">
            {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} / pág.</option>)}
          </select>
          <div>
            <input type="hidden" name="page" value="1" />
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">Aplicar</button>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Contacto</th>
                <th className="px-2 py-2">Doc</th>
                <th className="px-2 py-2">Ubicación</th>
                <th className="px-2 py-2">Vendedor</th>
                <th className="px-2 py-2">Reservas</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-2 py-10 text-center text-gray-400">Sin resultados</td></tr>
              )}
              {items.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-2">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-600">Creado: {fmtDate(c.createdAt)}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags?.map(t => (
                        <span key={t} className="rounded border px-1.5 py-0.5 text-[11px] text-gray-600">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      {c.email && <span className="text-xs text-gray-600">{c.email}</span>}
                      {c.phone && <span className="text-xs text-gray-600">{c.phone}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2">{c.documentId || "—"}</td>
                  <td className="px-2 py-2">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-2 py-2">{c.seller?.name || "—"}</td>
                  <td className="px-2 py-2">{c._count.reservations}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      c.isArchived ? "border-gray-200 bg-gray-100 text-gray-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>{c.isArchived ? "Archivado" : "Activo"}</span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <div className="flex gap-2">
                      <a href={`/dashboard-admin/clientes/${c.id}`} className="text-primary underline">Ver</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-xs text-gray-500">
            Página {page} de {totalPages} — Mostrando {items.length > 0 ? `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + items.length}` : "0"} de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              href={page > 1 ? `/dashboard-admin/clientes${qstr({ q, sellerId, archived, country, page: String(page - 1), pageSize: String(pageSize) })}` : "#"}
            >← Anterior</a>
            <a
              aria-disabled={page >= totalPages}
              className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              href={page < totalPages ? `/dashboard-admin/clientes${qstr({ q, sellerId, archived, country, page: String(page + 1), pageSize: String(pageSize) })}` : "#"}
            >Siguiente →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
