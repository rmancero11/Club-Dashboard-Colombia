import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SELLER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = params.id;

  // Validar ownership/visibilidad del cliente (si no es ADMIN)
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(auth.role !== "ADMIN" ? { sellerId: auth.userId! } : {}),
    },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reservas del cliente (filtradas por seller si aplica)
  const items = await prisma.reservation.findMany({
    where: {
      clientId,
      ...(auth.role !== "ADMIN" ? { sellerId: auth.userId! } : {}),
    },
    select: {
      id: true,
      code: true,
      destination: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ items }, { status: 200 });
}
