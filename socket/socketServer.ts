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
        (async () => {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { online: true }
                });
                // Notificamos a todos en tiempo real
                io.emit('user-status-change', { id: userId, online: true });
            } catch (err: any) {
                // El error de user.update puede ocurrir si el userId no existe o falla la DB.
                console.error(`Error setting ONLINE for ${userId}:`, err.message);
            }
        })();
    }

    // --- Listener de Notificación de Lectura ---
    socket.on('mark-messages-read', async (matchId: string) => {
        if (!userId || !matchId) return;

        try {
            // Modificación: Solo actualizamos si readAt es nulo.
            const updateResult = await prisma.message.updateMany({
                where: {
                    senderId: matchId,
                    receiverId: userId,
                    readAt: null,
                },
                data: {
                    readAt: new Date().toISOString(), // Usar ISO string para consistencia
                }
            });
            if (updateResult.count > 0) {

                // Notificar al match que sus mensajes han sido leídos (para el check doble)
                io.to(matchId).emit('messages-read-by-receiver', { 
                    readerId: userId, // Quien leyó (yo)
                    senderId: matchId  // Quien envió el mensaje original
                });
            }
        } catch (error) {
            console.error(`Error marking messages as read for user ${userId} in chat with ${matchId}:`, error);
        }
    });

    // --- Listener para Bloquear Usuario ---
    socket.on('block-user', async ({blockedUserId}: {blockedUserId: string}) => {
        // Usamos el ID del usuario que inicia la conexión (el bloqueador)
        const blockerId = socket.handshake.query.userId as string;

        if (!blockerId || !blockedUserId || blockerId === blockedUserId) {
            console.error('Intento de bloqueo inválido:', {blockerId, blockedUserId});
            return;
        };

        try {
            await prisma.blockedUser.create({
                data: {
                    blockerUserId: blockerId,
                    blockedUserId: blockedUserId,
                }
            });
            // 1. Notificación de éxito al bloqueador (User1)
            socket.emit('user-blocked-success', {blockedId: blockedUserId});
            // 2. Notificación de éxito al bloqueado (User2)
            io.to(blockedUserId).emit('you-are-blocked', {blockerId: blockerId});

        } catch (error: any) {
            // Manejamos el error de UNIQUE constraint si el bloqueo ya existía
            if (error.code !== 'P2002') { 
                console.error('Error blocking user:', error);
            }
        }
    });

    // --- Listener para desbloquear usuario ---
    socket.on('unblock-user', async ({ blockedUserId }: { blockedUserId: string }) => {
        // Usamos el ID del usuario que inicia la conexión (el desbloqueador)
        const unblockerId = socket.handshake.query.userId as string;
        
        if (!unblockerId || !blockedUserId || unblockerId === blockedUserId) {
            console.error('Intento de desbloqueo inválido:', {unblockerId, blockedUserId});
            return;
        };

        try {
            const result = await prisma.blockedUser.deleteMany({
                where: { blockerUserId: unblockerId, blockedUserId: blockedUserId }
            });
            
            if (result.count === 0) {
                socket.emit('unblock-error', { error: 'El usuario no estaba bloqueado.' });
                return;
            }

            // 1. Notificación de éxito al desbloqueador (User1)
            socket.emit('unblock-success', { blockedId: blockedUserId });

            // 2. Notificar al usuario desbloqueado (User2) para que pueda recargar sus matches/chat.
            io.to(blockedUserId).emit('you-are-unblocked', { unblockerId: unblockerId });

        } catch (error: any) {
            if (error.code !== 'P2002') { 
                console.error('Error unblocking user:', error);
            }
        }
    });

    // --- Lógica de send-message ---
    socket.on('send-message', async (data: { senderId: string, receiverId: string, content: string, imageUrl?: string, localId:string }) => {
        const senderId = data.senderId;
        const receiverId = data.receiverId;
        // Extraemos el localId (es solo para el cliente)
        const { localId, ...messageToSave } = data;

        if (!senderId || !receiverId || senderId === receiverId) return;

        try {
            // 1. VERIFICACIÓN DE BLOQUEO (RECEPTOR BLOQUEÓ AL REMITENTE)
            // ¿Me ha bloqueado el receptor?
            const isBlockedByReceiver = await prisma.blockedUser.findUnique({
                where: {
                    blockerUserId_blockedUserId: {
                        blockerUserId: receiverId, // ¿El receptor es el bloqueador?
                        blockedUserId: senderId, // ¿Yo soy el bloqueado?
                    },
                },
            });

            if (isBlockedByReceiver) {
                console.log(`El usuario ${senderId} ha sido bloqueado por ${receiverId}. Mensaje no enviado.`);
                socket.emit('message-error', {localId: localId, error: 'You are blocked by this user.'});
                return; // NO persistir, NO emitir
            }

            // 2. VERIFICACIÓN DE BLOQUEO (REMITENTE BLOQUEÓ AL RECEPTOR)
            // ¿He bloqueado yo al receptor?
            const didIBlockThem = await prisma.blockedUser.findUnique({
                 where: {
                    blockerUserId_blockedUserId: {
                        blockerUserId: senderId, // ¿Yo soy el bloqueador?
                        blockedUserId: receiverId, // ¿El receptor es el bloqueado?
                    },
                },
            });
            
            if (didIBlockThem) {
                console.log(`El usuario ${senderId} ha bloqueado a ${receiverId}. Mensaje no enviado.`);
                socket.emit('message-error', {localId: localId, error: 'You have blocked this user.'});
                return;
            }

            // Persistencia: Guardar en Supabase a través de Prisma
            const newMessage = await prisma.message.create({ data: messageToSave });

            // Emisión: Enviar al receptor (solo a la sala del receiverId)
            io.to(receiverId).emit('receive-message', newMessage); 

            // Confirmación: Confirmar el envío al remitente
            socket.emit('message-sent-success', { ...newMessage, localId: localId });
            
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
            // En caso de error, siempre devolver el localId para que el cliente sepa qué mensaje falló.
            socket.emit('message-error', {localId: localId, error: 'The message could not be sent.'}); 
        }
    });


    // Manejo de la Desconexión
    socket.on('disconnect', () => {
        if (userId) {
            (async () => {
                try {
                    // actualizamos el estado OFFLINE en la db
                    prisma.user.update({ 
                        where: { id: userId }, 
                        data: { online: false } 
                    });
                    // Notificamos a todos que este usuario está OFFLINE (tiempo real)
                    io.emit('user-status-change', { id: userId, online: false });
                    
                } catch (err: any) {
                    // El error de user.update puede ocurrir si el userId no existe o falla la DB.
                    console.error(`Error setting OFFLINE for ${userId}:`, err.message);
                }
            })();
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Socket Server escuchando en puerto ${PORT}`);
});