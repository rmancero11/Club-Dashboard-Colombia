import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/auth";
import { MatchStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: { matchId: string } }) {
    try {
        const auth = await getAuth();

        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const currentUserId = auth.userId;
        const targetUserId = params.matchId;

        if (!targetUserId) {
            return NextResponse.json({ message: "Missing matchId" }, { status: 400 });
        }

        // Paso 1: Buscar los IDs de los mensajes de la conversación
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: currentUserId },
                ],
            },
            // Es crucial traer el campo 'deletedBy' para no sobreescribir borrados anteriores
            select: { id: true, deletedBy: true },
        });

        if (messages && messages.length > 0) {
        const deletionEntry = { userId: currentUserId, deletedAt: new Date().toISOString() };
        
        await Promise.all(messages.map(async (msg) => {
            const existing = (msg.deletedBy || []) as { userId: string, deletedAt: string }[];
            const alreadyDeleted = existing.some(e => e.userId === currentUserId);
            
            if (alreadyDeleted) return null;

            const newDeletedBy = [...existing, deletionEntry];
            return prisma.message.update({
                where: { id: msg.id },
                data: { deletedBy: newDeletedBy as any },
            });
        }).filter(p => p !== undefined));
        }


        // Buscamos y Actualizamos el estado del Match a REJECTED
        // Primero buscamos el Match que conecta a estos dos usuarios
        const matchRecord = await prisma.match.findFirst({
            where: {
                OR: [
                    { userAId: currentUserId, userBId: targetUserId },
                    { userAId: targetUserId, userBId: currentUserId }
                ]
            },
            select: { id: true } // Solo necesitamos el ID
        });

        // Si encontramos el match, actualizamos su status usando su ID real
        if (matchRecord) {
            await prisma.match.update({
                where: { id: matchRecord.id }, // Usamos el ID de la tabla Match
                data: { 
                    status: MatchStatus.REJECTED 
                }
            });
        } else {
            console.warn("No se encontró un Match activo para actualizar el estado, pero los mensajes se procesaron.");
        }
        
        return NextResponse.json({ success: true, message: "Conversation and Match deleted" });
    
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 });
    }
}