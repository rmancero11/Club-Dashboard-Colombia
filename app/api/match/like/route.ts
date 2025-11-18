import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot like yourself" }, { status: 400 });
    }

    // --- Verificar CLIENT + suscripción ---
    const fromClient = await prisma.client.findUnique({
      where: { userId: fromUserId },
    });

    if (!fromClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!["PREMIUM", "VIP"].includes(fromClient.subscriptionPlan)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // --- Buscar si ya existe un match en ambas direcciones ---
    const existingForward = await prisma.match.findUnique({
      where: {
        userAId_userBId: {
          userAId: fromUserId,
          userBId: toUserId,
        },
      },
    });

    const existingReverse = await prisma.match.findUnique({
      where: {
        userAId_userBId: {
          userAId: toUserId,
          userBId: fromUserId,
        },
      },
    });

    let matched = false;

    if (existingReverse) {
      // El otro usuario ya había "likeado": ES MATCH
      await prisma.match.update({
        where: {
          userAId_userBId: {
            userAId: toUserId,
            userBId: fromUserId,
          },
        },
        data: { status: "ACCEPTED" },
      });

      matched = true;

    } else if (!existingForward) {
      // Nadie había likeado todavía: crear pendiente
      await prisma.match.create({
        data: {
          userAId: fromUserId,
          userBId: toUserId,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ ok: true, matched });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
