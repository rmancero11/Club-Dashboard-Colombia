import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@/app/lib/auth";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authResult.userId;

    // ============================
    // Likes enviados : PENDING donde YO soy el iniciador
    // ============================
    const likesSent = await prisma.match.findMany({
      where: {
        status: "PENDING",
        // userAId es el que siempre inicia
        userAId: userId, 
      },
    });
    // Likes recibidos: PENDING donde el OTRO es el iniciador
    const likesReceived = await prisma.match.findMany({
      where: {
        status: "PENDING",
        userBId: userId, // yo soy el receptor del like pendiente
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
      // Likes recibidos: el ID del usuario opuesto (el que envió el like a userB)
      likesReceived: likesReceived.map(m => m.userAId),
      // Likes enviados: el ID del usuario opuesto (el que recibió el like de userA)
      likesSent: likesSent.map((m) => m.userBId),
      // Matches: el ID del match (el opuesto)
      matches: matches.map((m) =>
        m.userAId === userId ? m.userBId : m.userAId
      ),
    });
  } catch (error) {
    console.error("Error en /api/match/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

}
