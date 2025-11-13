import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 Body recibido:", body);

    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot like yourself" }, { status: 400 });
    }

    // Encontrar el CLIENT asociado al usuario que envía el like
    const fromClient = await prisma.client.findUnique({
      where: { userId: fromUserId },
    });

    if (!fromClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Solo Premium o VIP pueden likear
    if (!["PREMIUM", "VIP"].includes(fromClient.subscriptionPlan)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Crear el like
    await prisma.clientLike.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
      update: {},
      create: { fromUserId, toUserId },
    });

    // Verificar like recíproco
    const reciprocal = await prisma.clientLike.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    let matched = false;

    if (reciprocal) {
      // Ordenar siempre el menor primero para evitar duplicados
      const [a, b] = [fromUserId, toUserId].sort();

      await prisma.clientMatch.upsert({
        where: {
          userAId_userBId: {
            userAId: a,
            userBId: b,
          },
        },
        update: {},
        create: {
          userAId: a,
          userBId: b,
        },
      });

      matched = true;
    }

    return NextResponse.json({ ok: true, matched });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
