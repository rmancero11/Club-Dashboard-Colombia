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

    // 1. OBTENEMOS USUARIOS QUE HAN BLOQUEADO AL USUARIO ACTUAL (Para FILTRADO)
    const usersWhoBlockedMe = await prisma.blockedUser.findMany({
      where: { blockedUserId: currentUserId }, // Yo soy el bloqueado
      select: { blockerUserId: true }, // Obtenemos el ID de los que me bloquearon
    });

    const blockedByMeIds = usersWhoBlockedMe.map(b => b.blockerUserId);

    // 2. OBTENEMOS USUARIOS QUE YO HE BLOQUEADO (Para el indicador isBlockedByMe)
    const usersIBlocked = await prisma.blockedUser.findMany({
      where: { blockerUserId: currentUserId }, // Yo soy el bloqueador
      select: { blockedUserId: true },
    });

    const iBlockedThemIds = usersIBlocked.map(b => b.blockedUserId);

    // 3. CONSULTAMOS LOS MATCHES ACEPTADOS, EXCLUYENDO A LOS QUE ME HAN BLOQUEADO
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId },
        ],
        status: MatchStatus.ACCEPTED,
        // Si cualquiera de los IDs es un bloqueador, NO incluir el match
        NOT: [
          { userAId: { in: blockedByMeIds } }, 
          { userBId: { in: blockedByMeIds } } 
        ]
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

    // 4. MAPEO FINAL Y AÑADIMOS ESTADO DE BLOQUEO
    const matchesWithLastMessage = await Promise.all(matches.map(async (match) => {
      const matchedUser = match.userAId === currentUserId ? match.userB : match.userA;

      // Verificamos si yo he bloqueado a este usuario
      const isBlockedByMe = iBlockedThemIds.includes(matchedUser.id);

      // Obtenemos el último mensaje
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
        isBlockedByMe: isBlockedByMe,
        lastMessageContent: lastMessage?.content ? (
          lastMessage.senderId === currentUserId ? `Tú: ${lastMessage.content}` : lastMessage.content
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
    console.error('Error in GET /api/chat/matches:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}