import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

// ===== Helpers comunes =====
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
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

// --- Utils para WhatsApp ---
function digitsOnly(raw?: string) {
  return (raw || "").replace(/\D/g, "");
}
/** Crea el link a WhatsApp usando API oficial (más estable que wa.me)
 *  Ej: https://api.whatsapp.com/send?phone=573001234567&text=Hola
 */
function waLinkFromStored(raw?: string | null, text?: string) {
  if (!raw) return "";
  const d = digitsOnly(raw);
  if (!d) return "";
  const params = new URLSearchParams();
  params.set("phone", d);
  if (text && text.trim()) params.set("text", text);
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

// =================== Página ===================
export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN") redirect("/unauthorized");

  // ===== Filtros/Orden =====
  const q =
    (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "";
  const resPendOrder =
    (Array.isArray(searchParams.resPendOrder)
      ? searchParams.resPendOrder[0]
      : searchParams.resPendOrder) ?? ""; // "asc" | "desc" | ""
  const tasksOrder =
    (Array.isArray(searchParams.tasksOrder)
      ? searchParams.tasksOrder[0]
      : searchParams.tasksOrder) ?? ""; // "asc" | "desc" | ""
  const page = toInt(searchParams.page, 1);
  const pageSizeRaw = toInt(searchParams.pageSize, 10);
  const pageSize = Math.min(pageSizeRaw, 50);

  // WHERE: búsqueda por nombre y email
  const whereUser: any = { role: "SELLER" };
  if (q) {
    whereUser.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
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
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true, // 👈 importante
        country: true,
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
      resPendOrder: resPendOrder || undefined,
      tasksOrder: tasksOrder || undefined,
      page: String(safePage),
      pageSize: String(pageSize),
    });
    redirect(`/dashboard-admin/vendedores${qs}`);
  }

  // ===== Métricas por vendedor (en lote) =====
  const sellerIds = sellers.map((s) => s.id);

  const PENDING_RES_STATUSES = ["LEAD", "QUOTED", "HOLD"] as const;
  const PENDING_TASK_STATUSES = ["OPEN", "IN_PROGRESS", "BLOCKED"] as const;

  let clientsBySeller: Record<string, number> = {};
  let resAllBySeller: Record<string, { count: number; sum: number }> = {};
  let resPendingBySeller: Record<string, number> = {};
  let tasksPendingBySeller: Record<string, number> = {};

  if (sellerIds.length > 0) {
    const [clientsGroup, resAll, resPending, tasksPending] = await Promise.all([
      prisma.client.groupBy({
        where: { sellerId: { in: sellerIds } },
        by: ["sellerId"],
        _count: { _all: true },
      }),
      prisma.reservation.groupBy({
        where: { sellerId: { in: sellerIds } },
        by: ["sellerId"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.reservation.groupBy({
        where: {
          sellerId: { in: sellerIds },
          status: { in: PENDING_RES_STATUSES as any },
        },
        by: ["sellerId"],
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        where: {
          sellerId: { in: sellerIds },
          status: { in: PENDING_TASK_STATUSES as any },
        },
        by: ["sellerId"],
        _count: { _all: true },
      }),
    ]);

    clientsBySeller = Object.fromEntries(
      clientsGroup.map((g) => [g.sellerId, g._count._all])
    );
    resAllBySeller = Object.fromEntries(
      resAll.map((g) => [
        g.sellerId,
        { count: g._count._all, sum: Number(g._sum.totalAmount || 0) },
      ])
    );
    resPendingBySeller = Object.fromEntries(
      resPending.map((g) => [g.sellerId, g._count._all])
    );
    tasksPendingBySeller = Object.fromEntries(
      tasksPending.map((g) => [g.sellerId, g._count._all])
    );
  }

  // ===== Reordenamiento por métricas (si aplica) =====
  let sellersSorted = [...sellers];
  if (resPendOrder === "asc" || resPendOrder === "desc") {
    sellersSorted.sort((a, b) => {
      const av = resPendingBySeller[a.id] ?? 0;
      const bv = resPendingBySeller[b.id] ?? 0;
      return resPendOrder === "asc" ? av - bv : bv - av;
    });
  }
  if (tasksOrder === "asc" || tasksOrder === "desc") {
    sellersSorted.sort((a, b) => {
      const av = tasksPendingBySeller[a.id] ?? 0;
      const bv = tasksPendingBySeller[b.id] ?? 0;
      return tasksOrder === "asc" ? av - bv : bv - av;
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendedores</h1>
          <p className="text-sm text-gray-500">Gestión de agentes.</p>
        </div>
        <Link
          href={`/signup?as=seller&next=${encodeURIComponent(
            "/dashboard-admin/vendedores"
          )}`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <span className="text-lg leading-none">＋</span>
          Crear vendedor
        </Link>
      </header>

      {/* Filtros / Orden */}
      <div className="rounded-xl border bg-white p-4">
        <form
          className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-5"
          method="GET"
        >
          <input
            name="q"
            defaultValue={q}
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar por nombre o email…"
          />

          {/* Orden por reservas pendientes (asc/desc) */}
          <select
            name="resPendOrder"
            defaultValue={resPendOrder}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Ordenar: Reservas pendientes</option>
            <option value="asc">Reservas pendientes ↑ (menor a mayor)</option>
            <option value="desc">Reservas pendientes ↓ (mayor a menor)</option>
          </select>

          {/* Orden por tareas pendientes (asc/desc) */}
          <select
            name="tasksOrder"
            defaultValue={tasksOrder}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Ordenar: Tareas pendientes</option>
            <option value="asc">Tareas pendientes ↑ (menor a mayor)</option>
            <option value="desc">Tareas pendientes ↓ (mayor a menor)</option>
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
            <a
              href="/dashboard-admin/vendedores"
              className="rounded-md border px-3 py-2 text-sm"
            >
              Borrar filtros
            </a>
          </div>
        </form>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-2 py-2">Vendedor</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Teléfono / WhatsApp</th>
                <th className="px-2 py-2">Clientes</th>
                <th className="px-2 py-2">Reservas Pendientes</th>
                <th className="px-2 py-2">Tareas Pendientes</th>
                <th className="px-2 py-2">Reservas Totales</th>
                <th className="px-2 py-2">Ventas Totales</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sellersSorted.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-2 py-10 text-center text-gray-400"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
              {sellersSorted.map((s) => {
                const clients = clientsBySeller[s.id] ?? 0;
                const ra = resAllBySeller[s.id] ?? { count: 0, sum: 0 };
                const resPend = resPendingBySeller[s.id] ?? 0;
                const tasksPend = tasksPendingBySeller[s.id] ?? 0;

                // Prioriza whatsappNumber; si no, usa phone (ambos se guardan con indicativo)
                const storedNumber = s.whatsappNumber ?? s.phone ?? "";
                const wa = waLinkFromStored(storedNumber);

                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-2 py-2">
                      <div className="font-medium">{s.name || "—"}</div>
                      <div className="text-xs text-gray-600">
                        Creado:{" "}
                        {new Date(s.createdAt).toLocaleDateString("es-CO")}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {s.email ? (
                        <a
                          href={`mailto:${s.email}`}
                          className="text-xs text-blue-600 underline"
                        >
                          {s.email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-700 underline"
                          title="Abrir WhatsApp"
                        >
                          {storedNumber}
                          <span aria-hidden>↗</span>
                        </a>
                      ) : storedNumber ? (
                        <span className="text-xs text-gray-600">
                          {storedNumber}
                        </span>
                      ) : (
                        // 👇 Si no hay número en la base de datos, se muestra vacío como antes
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">{clients}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${
                          resPend > 0
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        {resPend}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${
                          tasksPend > 0
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        {tasksPend}
                      </span>
                    </td>
                    <td className="px-2 py-2">{ra.count}</td>
                    <td className="px-2 py-2">{fmtMoney(ra.sum)}</td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex gap-1">
                        <a
                          href={`/dashboard-admin/vendedores/${s.id}`}
                          className="text-primary underline"
                        >
                          Ver
                        </a>
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
            {sellers.length > 0
              ? `${(page - 1) * pageSize + 1}–${
                  (page - 1) * pageSize + sellers.length
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
                  ? `/dashboard-admin/vendedores${qstr({
                      q,
                      resPendOrder: resPendOrder || undefined,
                      tasksOrder: tasksOrder || undefined,
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
                  ? `/dashboard-admin/vendedores${qstr({
                      q,
                      resPendOrder: resPendOrder || undefined,
                      tasksOrder: tasksOrder || undefined,
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
