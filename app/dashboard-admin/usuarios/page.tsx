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
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

const ROLES = ["ADMIN", "SELLER", "USER"] as const;
const STATUSES = ["ACTIVE", "INACTIVE"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");
  if (!auth.businessId) redirect("/unauthorized");

  const businessId = auth.businessId!;

  const q =
    (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const role =
    (Array.isArray(searchParams.role)
      ? searchParams.role[0]
      : searchParams.role) ?? ""; // "", ADMIN, SELLER, USER
  const status =
    (Array.isArray(searchParams.status)
      ? searchParams.status[0]
      : searchParams.status) ?? ""; // "", ACTIVE, INACTIVE
  const page = toInt(searchParams.page, 1);
  const pageSizeRaw = toInt(searchParams.pageSize, 10);
  const pageSize = Math.min(pageSizeRaw, 50);

  const where: any = { businessId };

  if (role && ROLES.includes(role as any)) where.role = role;
  if (status && STATUSES.includes(status as any)) where.status = status;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { destino: { contains: q, mode: "insensitive" } },
      { preference: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
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
        role: true,
        status: true,
        commissionRate: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    const qs = qstr({
      q,
      role,
      status,
      page: String(safePage),
      pageSize: String(pageSize),
    });
    redirect(`/dashboard-admin/usuarios${qs}`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-gray-500">
            Cuentas del negocio. Mostrando {items.length} de{" "}
            {total.toLocaleString("es-CO")}.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard-admin/usuarios/invitar"
            className="rounded-lg border px-4 py-2"
          >
            Invitar vendedor
          </a>
        </div>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border bg-white p-4">
        <form
          className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-5"
          method="GET"
        >
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre, email, país..."
          />
          <select
            name="role"
            defaultValue={role}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Rol (todos)</option>
            <option value="ADMIN">Admin</option>
            <option value="SELLER">Seller</option>
            <option value="USER">User</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Estado (todos)</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="rounded-md border px-3 py-2 text-sm"
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
          </div>
        </form>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Usuario</th>
                <th className="px-2 py-2">Contacto</th>
                <th className="px-2 py-2">Rol</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Comisión</th>
                <th className="px-2 py-2">Creado</th>
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
              {items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-2 py-2">
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="text-xs text-gray-600">
                      {u.country || "—"}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600">{u.email}</span>
                      {u.phone && (
                        <span className="text-xs text-gray-600">{u.phone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium border-gray-200 bg-white text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        u.status === "ACTIVE"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {u.role === "SELLER"
                      ? `${
                          u.commissionRate
                            ? Number(u.commissionRate).toFixed(2)
                            : "0.00"
                        }%`
                      : "—"}
                  </td>
                  <td className="px-2 py-2">{fmtDate(u.createdAt)}</td>
                  <td className="px-2 py-2 text-right">
                    <a
                      href={`/dashboard-admin/usuarios/${u.id}`}
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
                  ? `/dashboard-admin/usuarios${qstr({
                      q,
                      role,
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
                  ? `/dashboard-admin/usuarios${qstr({
                      q,
                      role,
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
