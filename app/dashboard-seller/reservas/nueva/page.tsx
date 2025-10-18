// app/dashboard-seller/reservas/nueva/page.tsx
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import SellerNewReservationForm from "@/app/components/seller/reservations/SellerNewReservationForm";
import { getCurrencyOptions } from "@/app/lib/currencyOptions";

export default async function NewSellerReservationPage({
  searchParams,
}: { searchParams?: { clientId?: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.businessId) redirect("/unauthorized");
  if (!["SELLER", "ADMIN"].includes(auth.role)) redirect("/unauthorized");

  const businessId = auth.businessId!;
  const sellerId = auth.userId!;

  // País del vendedor para preseleccionar moneda
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { country: true },
  });
  const defaultCurrency =
    (seller?.country || "").toLowerCase() === "colombia" ? "COP" : "USD";

  const [clients, destinations] = await Promise.all([
    prisma.client.findMany({
      where: { businessId, sellerId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.destination.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, country: true },
      orderBy: [{ popularityScore: "desc" }, { name: "asc" }],
      take: 200,
    }),
  ]);

  const currencyOptions = getCurrencyOptions(); // mismas opciones que usa admin

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva reserva</h1>
        <a
          href="/dashboard-seller/reservas"
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </a>
      </header>

      <div className="rounded-xl border bg-white p-4">
        <SellerNewReservationForm
          defaultClientId={searchParams?.clientId ?? null}
          clients={clients}
          destinations={destinations}
          currencyOptions={currencyOptions}
          defaultCurrency={defaultCurrency}
        />
      </div>
    </div>
  );
}
