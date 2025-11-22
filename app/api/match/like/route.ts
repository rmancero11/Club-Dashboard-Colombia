import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

export async function POST(req: Request) {
  try {
    // ---- Autenticación y obtención del ID del usuario que da LIKE ----
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const fromUserId = authResult.userId;

    // ---- Obtener ID del usuario recibido ----
    const body = await req.json();
    const { toUserId } = body;

    if (!toUserId) {
      return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot like yourself" }, { status: 400 });
    }

    // --- Verificar CLIENT + suscripción ---
    // Buscamos el perfil de Cliente del usuario que intenta dar like
    const fromClient = await prisma.client.findUnique({
      where: { userId: fromUserId },
    });

    if (!fromClient) {
      // Si no tiene perfil, no puede dar like
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // --- Verificar suscripción del cliente ----
    // Solo permitimos likes de clientes que tengan una suscripción Premium o VIP
    if (!["PREMIUM", "VIP"].includes(fromClient.subscriptionPlan as any)) {
      return NextResponse.json({ error: "Unauthorized: Requires Premium or VIP" }, { status: 403 });
    }

    // --- Buscar si ya existe un match en ambas direcciones ---
    const existingForward = await prisma.match.findUnique({
      where: {
        // Like de A a B
        userAId_userBId: {
          userAId: fromUserId,
          userBId: toUserId,
        },
      },
    });

    const existingReverse = await prisma.match.findUnique({
      where: {
        // Like de B a A
        userAId_userBId: {
          userAId: toUserId, // el otro usuario ya me dio like
          userBId: fromUserId, // yo
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
    // Devolvemos true si hubo un match (doble like)
    return NextResponse.json({ ok: true, matched });

  } catch (error) {
    console.error('Error creating like:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
