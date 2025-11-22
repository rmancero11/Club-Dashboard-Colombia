import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // ---- Autenticación y obtención del ID del usuario que hace UNLIKE ----
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const fromUserId = authResult.userId;

    const body = await req.json();
    const { toUserId } = body;

    if (!toUserId) {
      return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });
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
      { error: "Cannot remove an accepted match. Use the 'Block' feature instead." },
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
    console.error("Error creating unlike:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
