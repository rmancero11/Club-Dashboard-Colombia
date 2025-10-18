import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!auth.businessId) return NextResponse.json({ error: "No business" }, { status: 400 });
  if (!["SELLER","ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const businessId = auth.businessId!;
  const sellerId = auth.userId!;
  const clientId = params.id;

  // validar ownership del cliente
  const client = await prisma.client.findFirst({
    where: { id: clientId, businessId, ...(auth.role !== "ADMIN" ? { sellerId } : {}) },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await prisma.reservation.findMany({
    where: { businessId, ...(auth.role !== "ADMIN" ? { sellerId } : {}), clientId },
    select: { id: true, code: true, destination: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ items }, { status: 200 });
}
