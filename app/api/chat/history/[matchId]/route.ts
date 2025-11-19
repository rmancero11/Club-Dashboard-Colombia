import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyJWT } from "@/app/lib/auth";

const prisma = new PrismaClient();

// Tipado de los parametros de la ruta
interface Context {
  params: {
    matchId: string;
  };
}

export async function GET(request: Request, context: Context) {
  // ----- Verificamos autenticación -----
  const token = request.headers.get("Authorization")?.split(' ')[1];
  if (!token) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  const authResult = await verifyJWT(token);
  if (!authResult || !authResult.userId) {
    return NextResponse.json({mssage: 'Invalid or expired token'}, {status: 401});
  }

  const currentUserId = authResult.userId;
  const { matchId } = context.params;
  if (!matchId) {
    return NextResponse.json({message: 'Missing match ID'}, {status: 400});
  }

  try {
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
      take: 50, // Limitamos para paginación (ej: 50 mensajes por página)
    });
    // Devolvemos los mensajes
    return NextResponse.json(messages, {status: 200});

  }catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}