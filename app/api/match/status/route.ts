import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // ============================
  // Likes enviados : PENDING donde YO soy el iniciador
  // ============================
  const likesSent = await prisma.match.findMany({
    where: {
      status: "PENDING",
      userAId: userId, // Yo inicié el like
    },
  });
  const likesReceived = await prisma.match.findMany({
  where: {
    status: "PENDING",
    userBId: userId, // otro usuario me dio like a mí
  },
});
  // ============================
  // Matches aceptados
  // ============================
  const matches = await prisma.match.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });

  return NextResponse.json({
    likesReceived: likesReceived.map(m => m.userAId),
    likesSent: likesSent.map((m) => m.userBId),
    matches: matches.map((m) =>
      m.userAId === userId ? m.userBId : m.userAId
    ),
  });
}
