import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: { matchId: string } }) {
  try {
    const auth = await getAuth();
    if (!auth || !auth.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = auth.userId;
    const matchId = params.matchId;
    if (!matchId) {
      return NextResponse.json({ message: "Missing matchId" }, { status: 400 });
    }

    // Paso 1: Buscar los IDs de los mensajes de la conversación
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: matchId },
          { senderId: matchId, receiverId: currentUserId },
        ],
      },
      // Es crucial traer el campo 'deletedBy' para no sobreescribir borrados anteriores
      select: { id: true, deletedBy: true },
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: true, message: "Conversation already empty" });
    }

    // Obtenemos los IDs de todos los mensajes que pertenecen a la conversación.
    const messageIds = messages.map(msg => msg.id);

    const deletionEntry = { userId: currentUserId, deletedAt: new Date().toISOString() };

    // Paso 2: Actualizar todos los mensajes en una sola operación
    // ¡CRUCIAL! Para un soft delete masivo, es mejor usar updateMany. 
    // Sin embargo, como tu campo 'deletedBy' es un array JSON que requiere 
    // la lógica de append, *debemos* mantener el Promise.all, pero limpiándolo.
    
    await Promise.all(messages.map(async (msg) => {
    // const existing = Array.isArray(msg.deletedBy) ? msg.deletedBy : [];
    const existing = (msg.deletedBy || []) as { userId: string, deletedAt: string }[];
  
    const alreadyDeleted = existing.some(e => e.userId === currentUserId);
      
      // Si ya está marcado por este usuario, no hacemos nada.
      if (alreadyDeleted) return null;

      const newDeletedBy = [...existing, deletionEntry];
      
      return prisma.message.update({
        where: { id: msg.id },
        data: {
          deletedBy: newDeletedBy as any,
        },
      });
    }).filter(p => p !== undefined)
);

    return NextResponse.json({ success: true, message: "Conversation deleted for this user" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}