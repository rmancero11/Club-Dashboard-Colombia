import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";
import { MessageType } from "@/app/types/chat";

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
    const messageData = await prisma.message.findMany({
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
        imageUrl: true,
        createdAt: true,
        readAt: true,
        deletedBy: true,
      },
      // take: 50, // Limitamos para paginación (ej: 50 mensajes por página)
    });
    // Mapeamos los datos de Prisma al tipo MessageType del frontend
    const messages: MessageType[] = messageData.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt,
      readAt: msg.readAt,
      deletedBy: msg.deletedBy as string[] | null,
      status: 'sent' // El historial siempre viene con status 'sent'
    }));

    return NextResponse.json(messages, {status: 200});

  }catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
  }
}