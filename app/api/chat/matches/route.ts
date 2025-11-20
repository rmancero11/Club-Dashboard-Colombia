import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

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
    const matchData = await prisma.match.findMany({
      where: {
        // El usuario actual de ser userA o userB
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId },
        ],
        status: 'ACCEPTED',
      },
      // Incluimos la info del otro usuario (el match)
      select: {
        userAId: true,
        userBId: true,
        userA: {
          select: { id: true, name: true, avatar: true },
        },
        userB: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Procesamos los datos para devolver solo el contacto del match
    const matches = matchData.map(match => {
      // Determinamos cual de los dos es el match (el usuario opuesto al actual)
      const matchedUser = match.userAId === currentUserId
      ? match.userB
      : match.userA;

      return {
        id: matchedUser.id,
        name: matchedUser.name,
        avatar: matchedUser.avatar,
      };
    });
    // Devolvemos la lista de matches (contactos)
    return NextResponse.json(matches, { status: 200 });

  } catch (error) {
    console.error({error: "Error fetching matches"}, {status: 500});
  }
}