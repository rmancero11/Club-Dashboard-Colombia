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

    // No eliminamos match; sólo persistimos bloqueo
    return NextResponse.json({ ok: true, blocked: blocked.blockedUserId }, { status: 200 });

  } catch (error) {
    console.error('Error in API block POST:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await getAuth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const unblockerId = authResult.userId;

    // Leer body (puede venir en body JSON) o query param
    const url = new URL(req.url);
    const queryBlockedId = url.searchParams.get('blockedUserId');

    let bodyBlockedId: string | undefined = undefined;
    try {
      const body = await req.json();
      bodyBlockedId = body?.blockedUserId;
    } catch (e) {
      // ignore if no JSON body
    }

    const blockedUserId = bodyBlockedId ?? queryBlockedId;
    if (!blockedUserId) {
      return NextResponse.json({ error: "Missing blockedUserId" }, { status: 400 });
    }

    const result = await prisma.blockedUser.deleteMany({
      where: {
        blockerUserId: unblockerId,
        blockedUserId
      }
    });

    if (result.count > 0) {
      return NextResponse.json({ ok: true, unblocked: blockedUserId }, { status: 200 });
    } else {
      return NextResponse.json({ ok: false, message: 'No block record found' }, { status: 200 });
    }

  } catch (error) {
    console.error('Error in API block DELETE:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}