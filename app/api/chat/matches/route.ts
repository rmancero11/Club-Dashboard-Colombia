import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { MatchStatus } from "@prisma/client";
import prisma from "@/app/lib/prisma"; // usa la instancia central si la tenés

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = authResult.userId;

    const usersWhoBlockedMe = await prisma.blockedUser.findMany({
      where: { blockedUserId: currentUserId },
      select: { blockerUserId: true },
    });
    const blockedByMeIds = usersWhoBlockedMe.map(b => b.blockerUserId);

    const usersIBlocked = await prisma.blockedUser.findMany({
      where: { blockerUserId: currentUserId },
      select: { blockedUserId: true },
    });
    const iBlockedThemIds = usersIBlocked.map(b => b.blockedUserId);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
        status: MatchStatus.ACCEPTED,
        NOT: [
          { userAId: { in: blockedByMeIds } },
          { userBId: { in: blockedByMeIds } }
        ]
      },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        userA: {
          select: {
            id: true,
            name: true,
            avatar: true,
            online: true,
            country: true,
            birthday: true,
            gender: true,
            clientProfile: { select: { id: true } }, // <- aquí: clientProfile
          },
        },
        userB: {
          select: {
            id: true,
            name: true,
            avatar: true,
            online: true,
            country: true,
            birthday: true,
            gender: true,
            clientProfile: { select: { id: true } }, // <- aquí: clientProfile
          },
        },
      },
    });

    const matchesWithLastMessage = await Promise.all(matches.map(async (match) => {
      const matchedUser = match.userAId === currentUserId ? match.userB : match.userA;

      const isBlockedByMe = iBlockedThemIds.includes(matchedUser.id);

      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: matchedUser.id },
            { senderId: matchedUser.id, receiverId: currentUserId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, senderId: true },
      });

      return {
        id: matchedUser.id,
        clientId: matchedUser.clientProfile?.id ?? null, // <- clientId correcto
        name: matchedUser.name,
        avatar: matchedUser.avatar,
        online: matchedUser.online,
        country: matchedUser.country,
        birthday: matchedUser.birthday,
        gender: matchedUser.gender,
        isBlockedByMe,
        lastMessageContent: lastMessage?.content
          ? (lastMessage.senderId === currentUserId ? `Tú: ${lastMessage.content}` : lastMessage.content)
          : null,
        lastMessageAt: lastMessage?.createdAt || null,
      };
    }));

    matchesWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(matchesWithLastMessage);
  } catch (error) {
    console.error('Error in GET /api/chat/matches:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
