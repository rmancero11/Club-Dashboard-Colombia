import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";

function startEndOfMonth(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
function fmtMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export default async function AdminSellerDetailPage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "ADMIN" || !auth.businessId) redirect("/unauthorized");
  const businessId = auth.businessId!;

  const seller = await prisma.user.findFirst({
    where: { id: params.id, businessId, role: "SELLER" },
    select: { id: true, name: true, email: true, phone: true, country: true, commissionRate: true, status: true, createdAt: true },
  });
  if (!seller) notFound();

  const { start, end } = startEndOfMonth();

  const [clientsCount, resTotalAgg, resMonthAgg, tasksOpenCount, recentReservations, recentTasks] = await Promise.all([
    prisma.client.count({ where: { businessId, sellerId: seller.id } }),
    prisma.reservation.aggregate({
      where: { businessId, sellerId: seller.id },
      _count: { _all: true }, _sum: { totalAmount: true },
    }),
    prisma.reservation.aggregate({
      where: { businessId, sellerId: seller.id, startDate: { gte: start, lte: end } },
      _count: { _all: true }, _sum: { totalAmount: true },
    }),
    prisma.task.count({ where: { businessId, sellerId: seller.id, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.reservation.findMany({
      where: { businessId, sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, code: true, status: true, startDate: true, endDate: true, totalAmount: true, currency: true,
        client: { select: { name: true } },
        destination: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: { businessId, sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, priority: true, dueDate: true, createdAt: true },
    }),
  ]);

  const totalResCount = resTotalAgg._count._all;
  const totalResSum = Number(resTotalAgg._sum.totalAmount || 0);
  const monthResCount = resMonthAgg._count._all;
  const monthResSum = Number(resMonthAgg._sum.totalAmount || 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{seller.name || "Vendedor"}</h1>
          <p className="text-sm text-gray-500">{seller.email} · {seller.phone || "—"} · {seller.country || "—"}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/dashboard-admin/usuarios/${seller.id}`} className="rounded-md border px-3 py-2 text-sm">Editar</a>
          <a href="/dashboard-admin/vendedores" className="rounded-md border px-3 py-2 text-sm">← Volver</a>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Clientes</div>
          <div className="text-2xl font-semibold">{clientsCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Reservas (total)</div>
          <div className="text-2xl font-semibold">{totalResCount}</div>
          <div className="text-xs text-gray-500">{fmtMoney(totalResSum)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Reservas (mes)</div>
          <div className="text-2xl font-semibold">{monthResCount}</div>
          <div className="text-xs text-gray-500">{fmtMoney(monthResSum)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Tareas abiertas</div>
          <div className="text-2xl font-semibold">{tasksOpenCount}</div>
        </div>
      </section>

      {/* Listas */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Reservas recientes</h2>
          {recentReservations.length === 0 ? (
            <div className="text-gray-400">Sin reservas</div>
          ) : (
            <ul className="divide-y">
              {recentReservations.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.destination?.name || "—"} · {r.client?.name || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(r.startDate).toLocaleDateString("es-CO")} → {new Date(r.endDate).toLocaleDateString("es-CO")} · {r.status}
                      </div>
                    </div>
                    <div className="text-sm">{fmtMoney(Number(r.totalAmount), r.currency)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Tareas recientes</h2>
          {recentTasks.length === 0 ? (
            <div className="text-gray-400">Sin tareas</div>
          ) : (
            <ul className="divide-y">
              {recentTasks.map((t) => (
                <li key={t.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-gray-500">
                        {t.status} · {t.priority} {t.dueDate ? `· vence ${new Date(t.dueDate).toLocaleDateString("es-CO")}` : ""}
                      </div>
                    </div>
                    <a className="text-sm text-primary underline" href={`/dashboard-admin/tareas/${t.id}`}>Ver</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
