import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Cantidad de mensajes a cargar por página
const MESSAGES_PER_PAGE = 50;

export async function GET(req: Request, { params }: { params: { matchId: string } }) {
  const auth = await getAuth()
  if (!auth?.userId) return NextResponse.json({}, { status: 401 })

  const matchId = params.matchId

  const last = await prisma.message.findFirst({
    where: {
      OR: [
        { senderId: auth.userId, receiverId: matchId },
        { senderId: matchId, receiverId: auth.userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      content: true,
      imageUrl: true,
      createdAt: true
    }
  })

  return NextResponse.json({ last })
}
