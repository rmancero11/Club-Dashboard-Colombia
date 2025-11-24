import { Server, ServerOptions } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient(); 
const httpServer = createServer();

// Contenedor de Opciones de CORS (ServerOptions incluye el campo cors)
let corsOptions: Partial<ServerOptions> = {};

// Determinamos el origen del entorno
// 3. Lógica para determinar el origen según el entorno
if (PORT === 4000) {
    // Entorno de Desarrollo (Local)
    const allowedOriginsDev = process.env.ALLOWED_ORIGINS;
    
    if (!allowedOriginsDev) {
        // En caso de error, siempre usar el puerto local como fallback seguro
        console.warn('⚠️ WARNING: ALLOWED_ORIGINS no está configurado. Usando http://localhost:3000 por defecto.');
        corsOptions = {
            cors: { origin: ["http://localhost:3000"], methods: ["GET", "POST"] }
        };
    } else {
        corsOptions = {
            cors: {
                origin: [allowedOriginsDev],
                methods: ["GET", "POST"]
            }
        };
    }
} else {
    // Entorno de Producción (o cualquier otro puerto)
    const clientUrl = process.env.CLIENT_URL;
    
    if (!clientUrl) {
        throw new Error('Error: CLIENT_URL debe estar configurado en producción.');
    }

    corsOptions = {
        cors: {
            origin: [clientUrl],
            methods: ["GET", "POST"]
        }
    };
}

const io = new Server(httpServer, corsOptions);

io.on('connection', (socket) => {
    // Usamos el ID del usuariopasado en la query al conectar
    const userId = socket.handshake.query.userId as string;
    
    if (userId) {
        // Unimos a la Sala (Para mensajes privados) y actualizamos el estado Online
        socket.join(userId); 
        
        // Lógica de Online (Persistencia y Emisión)
        prisma.user.update(
            { where: { id: userId }, 
            data: { online: true } 
        })
        .then(() => {
            // Notificamos a todos que este usuario está Online (tiempo real)
            io.emit('user-status-change', { id: userId, online: true });
        })
        .catch ((err: any) => console.error(`Error setting ONLINE for ${userId}:`, err));
    }

    // --- Listener de Notificación de Lectura ---
    socket.on('mark-messages-read', async (matchId: string) => {
        if (!userId || !matchId) return;

        try {
            
            await prisma.message.updateMany({
                where: {
                    senderId: matchId,
                    receiverId: userId,
                    readAt: null,
                },
                data: {
                    readAt: new Date().toISOString(), // Usar ISO string para consistencia
                }
            });

            // Notificar al match que sus mensajes han sido leídos (para el check doble)
            io.to(matchId).emit('messages-read-by-receiver', { 
                readerId: userId, // Quien leyó (yo)
                senderId: matchId  // Quien envió el mensaje original
            });

        } catch (error) {
            console.error(`Error marking messages as read for user ${userId} in chat with ${matchId}:`, error);
        }
    });

    // --- Listener para Bloquear Usuario ---
    socket.on('block-user', async (blockedUserId: string) => {
        if (!userId || !blockedUserId || userId === blockedUserId) return;

        try {
            await prisma.blockedUser.create({
                data: {
                    blockerUserId: userId,
                    blockedUserId: blockedUserId,
                }
            });
            // Emitir a ambos usuarios que el bloqueo ha ocurrido para actualizar UI/conexión
            socket.emit('user-blocked-success', blockedUserId);
            io.to(blockedUserId).emit('you-have-been-blocked', userId);

        } catch (error: any) {
            // Manejamos el error de UNIQUE constraint si el bloqueo ya existía
            if (error.code !== 'P2002') { 
                console.error('Error blocking user:', error);
            }
        }
    });

    // --- Lógica de send-message ---
    socket.on('send-message', async (data: { senderId: string, receiverId: string, content: string, imageUrl?: string, localId:string }) => {
        if (!userId) return;

        try {
            // 1. VERIFICACIÓN DE BLOQUEO
            const isBlocked = await prisma.blockedUser.findUnique({
                where: {
                    blockerUserId_blockedUserId: {
                        blockerUserId: data.receiverId, // ¿Me ha bloqueado el receptor?
                        blockedUserId: userId,         // Soy yo
                    },
                },
            });

            if (isBlocked) {
                console.log(`El usuario ${userId} ha sido bloqueado por ${data.receiverId}. Mensaje no enviado.`);
                socket.emit('message-error', {error: 'You are blocked by this user.'});
                return; // NO persistir, NO emitir
            }

            // También podemos verificar si yo lo he bloqueado (aunque la UI debería evitar esto)
            const didIBlockThem = await prisma.blockedUser.findUnique({
                 where: {
                    blockerUserId_blockedUserId: {
                        blockerUserId: userId,
                        blockedUserId: data.receiverId,
                    },
                },
            });
            
            if (didIBlockThem) {
                 console.log(`El usuario ${userId} ha bloqueado a ${data.receiverId}. Mensaje no enviado.`);
                 socket.emit('message-error', {error: 'You have blocked this user.'});
                 return; 
            }

            // Persistencia: Guardar en Supabase a través de Prisma
            const newMessage = await prisma.message.create({ data: data });

            // Emisión: Enviar al receptor (solo a la sala del receiverId)
            io.to(data.receiverId).emit('receive-message', newMessage); 

            // Confirmación: Confirmar el envío al remitente
            socket.emit('message-sent-success', newMessage);
            
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
            socket.emit('message-error', {error: 'The message could not be sent.'});
        }
    });


    // Manejo de la Desconexión
    socket.on('disconnect', () => {
        if (userId) {
            // actualizamos el estado OFFLINE en la db
            prisma.user.update({ 
                where: { id: userId }, 
                data: { online: false } 
            })
            .then(() => {
                // Notificamos a todos que este usuario está OFFLINE (tiempo real)
                io.emit('user-status-change', { id: userId, online: false });
            })
            .catch ((err: any) => console.error(`Error setting OFFLINE for ${userId}:`, err));
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Socket Server escuchando en puerto ${PORT}`);
});