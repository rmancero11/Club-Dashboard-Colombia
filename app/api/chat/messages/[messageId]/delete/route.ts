import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const auth = await getAuth();
    if (!auth || !auth.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = auth.userId;
    const messageId = params.messageId;
    if (!messageId) {
      return NextResponse.json({ message: "Missing messageId" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, receiverId: true, deletedBy: true },
    });

    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    // Verificar que el user sea participante (remitente o receptor)
    if (message.senderId !== currentUserId && message.receiverId !== currentUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Construir entry y nuevo array (idempotente)
    const deletionEntry = { userId: currentUserId, deletedAt: new Date().toISOString() };

    const existing = Array.isArray(message.deletedBy) ? message.deletedBy : [];
    const alreadyDeletedByUser = existing.some((e: any) => e && e.userId === currentUserId);

    if (alreadyDeletedByUser) {
      // Nada que hacer: ya marcado por este usuario
      return NextResponse.json({ success: true, message: "Already deleted for this user" });
    }

    const newDeletedBy = [...existing, deletionEntry];

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedBy: newDeletedBy,
        content: "",      // vaciar contenido para que no sea visible
        imageUrl: null,   // eliminar imagen si existía
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        deletedBy: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        readAt: true,
      },
    });

    return NextResponse.json({ success: true, message: "Message deleted for this user", data: updated });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
