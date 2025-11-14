import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Likes que YO envié
  const likesSent = await prisma.clientLike.findMany({
    where: { fromUserId: userId },
  });

  // Matches donde participo
  const matches = await prisma.clientMatch.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });

  return NextResponse.json({
    likesSent: likesSent.map((l) => l.toUserId),
    matches: matches.map((m) =>
      m.userAId === userId ? m.userBId : m.userAId
    ),
  });
}
