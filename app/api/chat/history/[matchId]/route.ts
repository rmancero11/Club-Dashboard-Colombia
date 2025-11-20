import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';


export async function GET(request: Request, { params }: { params: { matchId: string } }) {
  try {
    // ----- Verificamos autenticación -----
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = authResult.userId;
    const matchId = params.matchId;
    if (!matchId) {
      return NextResponse.json({ message: 'Missing match ID' }, { status: 400 });
    }

    // ----- Obtenemos el historial de mensajes -----
    // Buscamos msgs donde: (Soy yo el remitente y él el receptor) O (Soy yo el receptor y él el remitente)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: matchId },
          { senderId: matchId, receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'asc', // Ordemanos cronologicamente (mas antiguos primero)
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        readAt: true,
      }
      // take: 50, // Limitamos para paginación (ej: 50 mensajes por página)
    });
    // Devolvemos los mensajes
    return NextResponse.json(messages, {status: 200});

  }catch (error) {
    console.error("Error fetching chat history.",`/api/chat/history/${params.matchId}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}