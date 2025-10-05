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
function fmtMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
function startEndOfMonth(yyyyMM?: string) {
  const now = new Date();
  const [y, m] = (yyyyMM || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-");
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1;
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;

  // filtros
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const status = (Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) ?? ""; // "", ACTIVE, INACTIVE
  const month = (Array.isArray(searchParams.month) ? searchParams.month[0] : searchParams.month) ?? "";
  const page = toInt(searchParams.page, 1);
  const pageSizeRaw = toInt(searchParams.pageSize, 10);
  const pageSize = Math.min(pageSizeRaw, 50);

  const whereUser: any = { businessId, role: "SELLER" };
  if (status === "ACTIVE" || status === "INACTIVE") whereUser.status = status;
  if (q) {
    whereUser.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, sellers] = await Promise.all([
    prisma.user.count({ where: whereUser }),
    prisma.user.findMany({
      where: whereUser,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, name: true, email: true, phone: true, country: true,
        status: true, commissionRate: true, createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    const qs = qstr({ q, status, month, page: String(safePage), pageSize: String(pageSize) });
    redirect(`/dashboard-admin/vendedores${qs}`);
  }

  // métricas por vendedor (en lote)
  const sellerIds = sellers.map((s) => s.id);
  const { start, end } = startEndOfMonth(month);

  let clientsBySeller: Record<string, number> = {};
  let resAllBySeller: Record<string, { count: number; sum: number }> = {};
  let resMonthBySeller: Record<string, { count: number; sum: number }> = {};
  let tasksOpenBySeller: Record<string, number> = {};

  if (sellerIds.length > 0) {
    const [clientsGroup, resAll, resMonth, tasksOpen] = await Promise.all([
      prisma.client.groupBy({
        where: { businessId, sellerId: { in: sellerIds } },
        by: ["sellerId"],
        _count: { _all: true },
      }),
      prisma.reservation.groupBy({
        where: { businessId, sellerId: { in: sellerIds } },
        by: ["sellerId"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.reservation.groupBy({
        where: { businessId, sellerId: { in: sellerIds }, startDate: { gte: start, lte: end } },
        by: ["sellerId"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.task.groupBy({
        where: { businessId, sellerId: { in: sellerIds }, status: { in: ["OPEN", "IN_PROGRESS"] } },
        by: ["sellerId"],
        _count: { _all: true },
      }),
    ]);

    clientsBySeller = Object.fromEntries(clientsGroup.map((g) => [g.sellerId, g._count._all]));
    resAllBySeller = Object.fromEntries(
      resAll.map((g) => [g.sellerId, { count: g._count._all, sum: Number(g._sum.totalAmount || 0) }])
    );
    resMonthBySeller = Object.fromEntries(
      resMonth.map((g) => [g.sellerId, { count: g._count._all, sum: Number(g._sum.totalAmount || 0) }])
    );
    tasksOpenBySeller = Object.fromEntries(tasksOpen.map((g) => [g.sellerId, g._count._all]));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendedores</h1>
          <p className="text-sm text-gray-500">
            Gestión de agentes. Mostrando {sellers.length} de {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard-admin/usuarios/invitar" className="rounded-lg border px-4 py-2">Invitar vendedor</a>
          <a href="/dashboard-admin/usuarios" className="rounded-lg border px-4 py-2">Ver todos los usuarios</a>
        </div>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-4">
        <form className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-5" method="GET">
          <input
            name="q" defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre, email, país..."
          />
          <select name="status" defaultValue={status} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Estado (todos)</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
          <input type="month" name="month" defaultValue={month || undefined} className="rounded-md border px-3 py-2 text-sm" />
          <select name="pageSize" defaultValue={String(pageSize)} className="rounded-md border px-3 py-2 text-sm">
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>{n} / pág.</option>
            ))}
          </select>
          <div>
            <input type="hidden" name="page" value="1" />
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">Aplicar</button>
          </div>
        </form>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Vendedor</th>
                <th className="px-2 py-2">Contacto</th>
                <th className="px-2 py-2">Comisión</th>
                <th className="px-2 py-2">Clientes</th>
                <th className="px-2 py-2">Reservas (total)</th>
                <th className="px-2 py-2">Ventas (total)</th>
                <th className="px-2 py-2">Reservas (mes)</th>
                <th className="px-2 py-2">Ventas (mes)</th>
                <th className="px-2 py-2">Tareas abiertas</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-2 py-10 text-center text-gray-400">Sin resultados</td>
                </tr>
              )}
              {sellers.map((s) => {
                const clients = clientsBySeller[s.id] || 0;
                const ra = resAllBySeller[s.id] || { count: 0, sum: 0 };
                const rm = resMonthBySeller[s.id] || { count: 0, sum: 0 };
                const openTasks = tasksOpenBySeller[s.id] || 0;

                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-2 py-2">
                      <div className="font-medium">{s.name || "—"}</div>
                      <div className="text-xs text-gray-600">Creado: {new Date(s.createdAt).toLocaleDateString("es-CO")}</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600">{s.email}</span>
                        {s.phone && <span className="text-xs text-gray-600">{s.phone}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {s.commissionRate ? `${Number(s.commissionRate).toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-2 py-2">{clients}</td>
                    <td className="px-2 py-2">{ra.count}</td>
                    <td className="px-2 py-2">{fmtMoney(ra.sum)}</td>
                    <td className="px-2 py-2">{rm.count}</td>
                    <td className="px-2 py-2">{fmtMoney(rm.sum)}</td>
                    <td className="px-2 py-2">{openTasks}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        s.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-100 text-gray-600"
                      }`}>
                        {s.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex gap-2">
                        <a href={`/dashboard-admin/vendedores/${s.id}`} className="text-primary underline">Ver</a>
                        <a href={`/dashboard-admin/usuarios/${s.id}`} className="text-primary underline">Editar</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-xs text-gray-500">
            Página {page} de {totalPages} — Mostrando{" "}
            {sellers.length > 0 ? `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + sellers.length}` : "0"}
            {" "}de {total.toLocaleString("es-CO")}
          </div>
          <div className="flex items-center gap-2">
            <a
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              href={
                page > 1
                  ? `/dashboard-admin/vendedores${qstr({ q, status, month, page: String(page - 1), pageSize: String(pageSize) })}`
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
                  ? `/dashboard-admin/vendedores${qstr({ q, status, month, page: String(page + 1), pageSize: String(pageSize) })}`
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
