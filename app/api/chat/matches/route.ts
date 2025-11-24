import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { MatchStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Autenticación usando la cookie
    const authResult = await getAuth();

    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = authResult.userId;

    // ----- Obtenemos los matches ACEPTADOS -----
    // Buscamos donde currentUserId es userA o userB, y el status es ACCEPTED
    const matches = await prisma.match.findMany({
      where: {
        // El usuario actual de ser userA o userB
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId },
        ],
        status: MatchStatus.ACCEPTED,
      },
      // Incluimos la info del otro usuario (el match)
      select: {
        id: true,
        userAId: true,
        userBId: true,
        userA: {
          select: { id: true, name: true, avatar: true, online: true, country: true, birthday: true, gender: true },
        },
        userB: {
          select: { id: true, name: true, avatar: true, online: true, country: true, birthday: true, gender: true },
        },
      },
    });

    // Obtenemos el ultimo mensaje para cada match
    const matchesWithLastMessage = await Promise.all(matches.map(async (match) => {
      // Determinamos el ID del usuario con el que se tiene match
      const matchedUser = match.userAId === currentUserId ? match.userB : match.userA;

      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: matchedUser.id },
            { senderId: matchedUser.id, receiverId: currentUserId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          content: true,
          createdAt: true,
          senderId: true,
        },
      });

      return {
        id: matchedUser.id,
        name: matchedUser.name,
        avatar: matchedUser.avatar,
        online: matchedUser.online,
        country: matchedUser.country,
        birthday: matchedUser.birthday,
        gender: matchedUser.gender,
        lastMessageContent: lastMessage?.content ? (
          lastMessage.senderId === currentUserId ? `Tu: ${lastMessage.content}` : lastMessage.content
        ) : null,
        lastMessageAt: lastMessage?.createdAt || null,
      };
    }));

    // Ordenamos la lista final por la hora del ultimo mensaje
    matchesWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA; // Orden descendiente (mas nuevos arriba)
    });

    return NextResponse.json(matchesWithLastMessage);    

  } catch (error) {
    console.error("Error fetching matches", error);
    return NextResponse.json({message: 'Internal Server Error'}, { status: 500 });
  }
}