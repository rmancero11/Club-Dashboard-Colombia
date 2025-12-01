import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Cantidad de mensajes a cargar por página
const MESSAGES_PER_PAGE = 50;

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

    // Obtenemos los parámetros de consulta para la paginación
    const { searchParams } = new URL(request.url);
    // lastMessageId es el 'cursor' para obtener mensajes ANTERIORES a él
    const lastMessageId = searchParams.get('lastMessageId');

    // ----- Obtenemos el historial de mensajes -----
    // Obtener mensajes filtrando los que el usuario borró
    // Buscamos msgs donde: (Soy yo el remitente y él el receptor) O (Soy yo el receptor y él el remitente)
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: matchId },
          { senderId: matchId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        readAt: true,
        deletedBy: true,
      },
    });

    const visibleMessages = allMessages;

    // ----- 4. PAGINACIÓN -----
    let paginated;

    if (lastMessageId) {
      const index = visibleMessages.findIndex((m) => m.id === lastMessageId);

      if (index === -1) {
        paginated = visibleMessages.slice(0, MESSAGES_PER_PAGE);
      } else {
        paginated = visibleMessages.slice(
          index + 1,
          index + 1 + MESSAGES_PER_PAGE
        );
      }
    } else {
      paginated = visibleMessages.slice(0, MESSAGES_PER_PAGE);
    }

    const hasMore = allMessages.length > paginated.length;

    // ----- Formateo -----
    const formattedMessages = paginated
      .map((msg) => ({
        ...msg,
        status: "sent",
        localId: msg.id,
      }))
      .reverse();

    return NextResponse.json({
      messages: formattedMessages,
      hasMore,
    });

    
  }catch (error) {
    console.error(`Error fetching messages for match ${params.matchId}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}