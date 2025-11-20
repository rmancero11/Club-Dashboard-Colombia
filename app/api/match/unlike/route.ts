import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    // Ordenar IDs para respetar la key única
    const [userAId, userBId] = [fromUserId, toUserId].sort();

    const existingMatch = await prisma.match.findUnique({
      where: {
        userAId_userBId: { userAId, userBId }
      }
    });

    if (!existingMatch) {
      return NextResponse.json({ ok: true, deleted: false });
    }

    // Si aún es un like pendiente → se elimina
    if (existingMatch.status === "PENDING") {
      await prisma.match.delete({
        where: {
          userAId_userBId: { userAId, userBId }
        }
      });

      return NextResponse.json({ ok: true, deleted: true });
    }

    // Si ya era un match aceptado
    // podés decidir qué hacer:
    // Opción A: no permitir borrar
    return NextResponse.json(
      { error: "Cannot remove an accepted match" },
      { status: 403 }
    );

    // Opción B: marcar como REJECTED
    /*
    await prisma.match.update({
      where: { userAId_userBId: { userAId, userBId } },
      data: { status: "REJECTED" }
    });
    return NextResponse.json({ ok: true, deleted: true });
    */
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
