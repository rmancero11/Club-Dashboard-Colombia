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

    // Buscamos mensajes entre ambos
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: matchId },
          { senderId: matchId, receiverId: currentUserId },
        ],
      },
      select: { id: true, deletedBy: true },
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: true, message: "Conversation already empty" });
    }

    const deletionEntry = { userId: currentUserId, deletedAt: new Date().toISOString() };

    // Actualizamos cada mensaje (idempotente)
    await Promise.all(messages.map(async (msg) => {
      const existing = Array.isArray(msg.deletedBy) ? msg.deletedBy : [];
      const alreadyDeleted = existing.some((e: any) => e && e.userId === currentUserId);
      if (alreadyDeleted) return null;

      const newDeletedBy = [...existing, deletionEntry];
      return prisma.message.update({
        where: { id: msg.id },
        data: {
          deletedBy: newDeletedBy,
          content: "",
          imageUrl: null,
        },
      });
    }));

    return NextResponse.json({ success: true, message: "Conversation deleted for this user" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
