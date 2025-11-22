import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // ---- Autenticación y obtención del ID del usuario que BLOQUEA ----
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const blockerUserId = authResult.userId;

    // ---- Obtención del ID del usuario BLOQUEADO ----
    const body = await req.json();
    const { blockedUserId } = body;

    if (!blockedUserId) {
      return NextResponse.json({ error: "Missing blockedUserId" }, { status: 400 });
    }

    if (blockerUserId === blockedUserId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // ---- Crear el registro de bloqueo ----
    // Se usa 'upsert' para evitar errores si el bloqueo ya existe (gracias a @@unique)
    const blocked = await prisma.blockedUser.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId,
          blockedUserId,
        },
      },
      update: {}, // No se actualiza nada si ya existe
      create: {
        blockerUserId,
        blockedUserId,
      },
    });

    // ---- Eliminar cualquier Match existente para que desaparezca del chat ----    
    // Los IDs se ordenan alfabéticamente para encontrar el registro unico de prisma
    const [userAId, userBId] = [blockerUserId, blockedUserId].sort();

    await prisma.match.deleteMany({
      where: {
        // Buscamos el match sin importar quien es userA o userB
        userAId,
        userBId,
      }
    });

    return NextResponse.json({ ok: true, blocked: blocked.blockedUserId }, { status: 200 });

  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}