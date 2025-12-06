import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await req.text();
    console.log("🔥 RAW BODY:", raw);

    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON PARSE ERROR");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { toClientId, amount, note } = body;
    console.log("✅ PARSED:", { toClientId, amount, note });

    if (!toClientId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // ⬇️ dejás todo lo demás igual desde acá

    // ===============================
    // 1. Obtener Client emisor
    // ===============================
    const fromClient = await prisma.client.findUnique({
      where: { userId: auth.userId },
    });

    if (!fromClient) {
      return NextResponse.json({ error: "Sender client not found" }, { status: 404 });
    }

    if (fromClient.travelPoints < amount) {
      return NextResponse.json({ error: "Insufficient travel points" }, { status: 400 });
    }

    // ===============================
    // 2. Obtener Client receptor
    // ===============================
    const toClient = await prisma.client.findUnique({
      where: { id: toClientId },
    });

    if (!toClient) {
      return NextResponse.json({ error: "Recipient client not found" }, { status: 404 });
    }

    // ===============================
    // 3. Verificar MATCH ACEPTADO
    // ===============================
    const match = await prisma.match.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            userAId: fromClient.userId,
            userBId: toClient.userId,
          },
          {
            userAId: toClient.userId,
            userBId: fromClient.userId,
          },
        ],
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "No accepted match between users" },
        { status: 403 }
      );
    }

    // ===============================
    // 4. Transacción Atómica
    // ===============================
    const result = await prisma.$transaction([
      prisma.client.update({
        where: { id: fromClient.id },
        data: {
          travelPoints: { decrement: amount },
        },
      }),

      prisma.client.update({
        where: { id: toClient.id },
        data: {
          travelPoints: { increment: amount },
        },
      }),

      prisma.travelPointsTransaction.create({
        data: {
          type: "TRANSFER",
          amount,
          note,
          fromClientId: fromClient.id,
          toClientId: toClient.id,
          expiresAt: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 365 // 1 año
          ),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Points transferred successfully",
      transaction: result[2],
    });
  } catch (error) {
    console.error("TRANSFER ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
