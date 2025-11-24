import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { MessageType } from "@/app/types/chat";

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
    // Buscamos msgs donde: (Soy yo el remitente y él el receptor) O (Soy yo el receptor y él el remitente)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: matchId },
          { senderId: matchId, receiverId: currentUserId },
        ],
      },
      ...(lastMessageId && {
        cursor: { id: lastMessageId },
        skip: 1,
      }),
      take: MESSAGES_PER_PAGE,
      orderBy: {
        createdAt: 'asc', // Ordemanos cronologicamente (mas antiguos primero)
      },
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



    // 3. Formateamos y devolvemos los mensajes
    // Los devolvemos en el orden cronológico correcto (ascendente) para el frontend
    const formattedMessages = messages
      .map(msg => ({
        ...msg,
        // Añadimos status 'sent' ya que vienen de la DB
        status: 'sent', 
        localId: msg.id, // Usamos el ID de la DB como localId
      }))
      .reverse(); // Invertimos para que los más antiguos queden arriba

    // Determinamos si hay más mensajes disponibles
    const hasMore = messages.length === MESSAGES_PER_PAGE;
    
    // Devolvemos los mensajes y el indicador de paginación
    return NextResponse.json({ 
        messages: formattedMessages, 
        hasMore: hasMore,
    });

  }catch (error) {
    console.error(`Error fetching messages for match ${params.matchId}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}