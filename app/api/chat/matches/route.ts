import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyJWT } from "@/app/lib/auth";
import { match } from "assert";

const prisma = new PrismaClient();

// Definimos la estructura minima del contacto que devolveremos
interface Contact {
  id: string;
  name: string | null;
  avatar: string;
}

export async function GET(request: Request)  {
  // ----- Verificamos autenticación -----
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  const authResult = await verifyJWT(token);
  if (!authResult || !authResult.userId) {
    return NextResponse.json({message: 'Invalid or expired token'}, {status: 401});
  }

  const currentUserId = authResult.userId;

  try {
    // ----- Obtenemos los matches ACEPTADOS -----
    // Incluimos los datos completos de userA y userB para saber quién es el contacto
    const acceptedMatches = await prisma.match.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId },
        ],
      },
      include: {
        userA: {
          select: { id: true, name: true,avatar: true },
        },
        userB: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // Ordenamos por fecha de ultimo mensaje o de creación
      },
    });

    // ----- Transformamos los resultados a una lista de contactos (el "otro" usuario) -----
    const contacts: Contact[] = acceptedMatches.map((match) => {
      // Decidimos quién es el contacto (el usuario diferente al currentUserId)
      const contactUser = match.userA.id === currentUserId
      ? match.userB
      : match.userA;

      // Construimos el objeto Contact y aseguramos que los tipos coincidan
      return {
        id: contactUser.id,
        name: contactUser.name,
        avatar: contactUser.avatar,
      } as Contact;
    });

    // Devolvemos la lista de contactos
    return NextResponse.json(contacts, {status: 200});

  }catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
  }
}