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

    // ----- 2. Obtenemos el historial de mensajes (Prisma Query con cursor) -----
    // El historial debe ordenarse de forma INVERSA (desc) para la paginación de scroll infinito
    // y luego invertirse en el cliente.
    const whereClause = {
      OR: [
        { senderId: currentUserId, receiverId: matchId },
        { senderId: matchId, receiverId: currentUserId },
      ],
    };

    // Parámetros base para la consulta
    const queryOptions: any = {
      where: whereClause,
      take: MESSAGES_PER_PAGE + 1, // Solicitamos +1 para verificar si hay más
      orderBy: { createdAt: "desc" as const }, // Más recientes primero
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
    };

    // Si hay un cursor (lastMessageId), lo añadimos para la paginación
    if (lastMessageId) {

      // Usando `cursor` y `skip` para paginación (offset) sin perder el contexto:
      queryOptions.cursor = { id: lastMessageId };
      queryOptions.skip = 1; // Omitir el cursor en sí
    }
    const messages = await prisma.message.findMany(queryOptions);

    // ----- 3. Lógica de `hasMore` -----
    let hasMore = false;
    let paginatedMessages = messages;

    if (messages.length > MESSAGES_PER_PAGE) {
      hasMore = true;
      // Removemos el mensaje extra que pedimos para el control de `hasMore`
      paginatedMessages = messages.slice(0, MESSAGES_PER_PAGE);
    }

    // ----- 4. Formateo y Ordenamiento (Lo invertimos para que el más viejo esté primero) -----
    // El cliente (ConversationWindow) espera el orden del más viejo al más nuevo.
    const formattedMessages = paginatedMessages
      .map((msg) => ({
      ...msg,
      status: "sent" as const, // Forzamos el tipo 'sent'
      localId: msg.id,
    }))
    .reverse(); // 👈 Ahora el más viejo está al principio, listo para ser prependMessages

    return NextResponse.json({
      messages: formattedMessages,
      hasMore,
    });  
  }catch (error) {
    console.error(`Error fetching messages for match ${params.matchId}:`, error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }

}