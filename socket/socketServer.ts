import { Server, ServerOptions } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient(); 
const httpServer = createServer();

// Endpoint de Health Check para evitar Dormancia en Render
httpServer.on('request', (req, res) => {
    // Detectamos si la petición es para /api/health
    if (req.url === '/api/health' && (req.method === 'GET' || req.method === 'HEAD')) {
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        if ( req.method === 'HEAD') {
            res.end();
        
        } else {
            res.end(JSON.stringify({
                status: 'ok',
                service: 'socket-server-keepalive',
                timestamp: new Date().toISOString()
            }));
        }
    }
});

// Contenedor de Opciones de CORS (ServerOptions incluye el campo cors)
let corsOptions: Partial<ServerOptions> = {};

// 1. Definir la lista de orígenes permitidos
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const clientUrlProd = process.env.CLIENT_URL;

// Inicializamos con los orígenes del .env, separados por coma
let origins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(url => url.trim()).filter(url => url.length > 0)
    : [];

// 2. Agregar el CLIENT_URL (producción/dominio principal) si no está presente
if (clientUrlProd && !origins.includes(clientUrlProd)) {
    origins.push(clientUrlProd);
}

// 3. Fallback en desarrollo: si no hay orígenes definidos y estamos en el puerto 4000
if (PORT === 4000 && origins.length === 0) {
    console.warn('⚠️ WARNING: No hay orígenes configurados. Usando http://localhost:3000 por defecto.');
    origins.push("http://localhost:3000");
}
console.log('✅ Socket CORS Allowed Origins:', origins); // Log para depurar en Render

// 4. Aplicar opciones de CORS
corsOptions = {
    cors: {
        // En producción, esto incluirá la url de producción
        origin: origins,
        methods: ["GET", "POST"],
        credentials: true // Relevante si usas cookies de autenticación
    }
};

// Aumentar el pingTimeout (tiempo que espera a un pong antes de desconectar)
// y el pingInterval (frecuencia con la que envía un ping) para evitar desconexiones prematuras.
const io = new Server(httpServer, {
    pingTimeout: 60000, // 60 segundos (el valor predeterminado es 20000)
    pingInterval: 25000, // 25 segundos (el valor predeterminado es 25000, podemos mantenerlo o ajustarlo)
    ...corsOptions
});

/* ------------------ HELPERS ------------------ */
const safeEmit = (room: string, event: string, payload: any) => {
  try {
    io.to(room).emit(event, payload);
  } catch (e) {
    console.error(`emit error: ${event}`, e);
  }
};

io.on('connection', (socket) => {
    // Usamos el ID del usuario pasado en la query al conectar
    const userId = socket.handshake.query.userId as string;

    console.log('Se conecto socket con el usuario de ID: ', userId);    
    
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


    // --------- DELETE MESSAGE (realtime sync) -----------
    socket.on('delete-message', async (payload: { messageId: string; matchId: string; userId: string }) => {
    try {
        const { messageId, matchId, userId: deletedBy } = payload;
        // Seguridad básica: comprobar que el socket realmente pertenece a deletedBy
        const socketUserId = socket.handshake.query.userId as string;
        if (!socketUserId || socketUserId !== deletedBy) {
        // no autorizado para emitir ese evento (evitamos spoofing elemental)
        console.warn('delete-message: user mismatch', { socketUserId, deletedBy });
        return;
        }

        // Emitimos a las sesiones del mismo usuario (para sincronizar pc/otro navegador)
        io.to(deletedBy).emit('message-deleted', {
        messageId,
        deletedBy,
        matchId,
        });

        // Emitimos también al match (opcional; el cliente decidirá si actúa)
        if (matchId) {
        io.to(matchId).emit('message-deleted', {
            messageId,
            deletedBy,
            matchId,
        });
        }
    } catch (err) {
        console.error('Error in delete-message handler:', err);
    }
    });


    // --------- DELETE CONVERSATION (realtime sync) -----------
    socket.on('delete-conversation', async (payload: { matchId: string; userId: string }) => {
    try {
        const { matchId, userId: deletedBy } = payload;
        const socketUserId = socket.handshake.query.userId as string;
        if (!socketUserId || socketUserId !== deletedBy) {
        console.warn('delete-conversation: user mismatch', { socketUserId, deletedBy });
        return;
        }

        // Emitimos a las sesiones del mismo usuario
        io.to(deletedBy).emit('conversation-deleted', {
        matchId,
        deletedBy,
        });

        // Emitimos también al match (opcional)
        if (matchId) {
        io.to(matchId).emit('conversation-deleted', {
            matchId,
            deletedBy,
        });
        }
    } catch (err) {
        console.error('Error in delete-conversation handler:', err);
    }
    });

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


    socket.on('block-user', async ({ blockedUserId }) => {
        const blockerId = userId;
        if (!blockerId || !blockedUserId) return;

        try {
        await prisma.blockedUser.upsert({
            where: {
                blockerUserId_blockedUserId: {
                    blockerUserId: blockerId,
                    blockedUserId,
                },
            },
            update: {}, // No se actualiza nada si ya existe
            create: {
                blockerUserId: blockerId,
                blockedUserId,
            },
        });

        // socket.emit('user-blocked-success', { blockedId: blockedUserId });
        // io.to(blockedUserId).emit('you-are-blocked', { blockerId });

        // Confirmación al propio bloqueador (todas sus sesiones)
        io.to(blockerId).emit('user-blocked-success', { blockedId: blockedUserId });

        // Notificar al bloqueado que fue bloqueado (todas sus sesiones)
        io.to(blockedUserId).emit('you-are-blocked', { blockerId });

        } catch (e: any) {
        // if (e.code !== 'P2002') console.error(e);
        console.error('Error in socket block-user:', e);
        }
    });


    socket.on('unblock-user', async ({ blockedUserId }) => {
        const unblockerId = userId;
        if (!unblockerId || !blockedUserId) return;

        try {
            const result = await prisma.blockedUser.deleteMany({
                where: {
                    blockerUserId: unblockerId,
                    blockedUserId
                },
            });

            if (result.count > 0) {
                io.to(unblockerId).emit('unblock-success', { blockedId: blockedUserId });
                io.to(blockedUserId).emit('you-are-unblocked', { unblockerId });
            }

        } catch (err) {
            console.error('Error in socket unblock-user:', err);
        }
    });

    /* ----------------- NOTIFY-only events -----------------
   Estos handlers **no tocan la DB**: sirven cuando la acción
   se realizó por la API REST y queremos notificar a los sockets.
   (El cliente llamará la API y luego emitirá 'notify-block' para avisar)
    */
    socket.on('notify-block', ({ blockedUserId }) => {
    const blockerId = userId;
    if (!blockerId || !blockedUserId) return;

    // Notificamos al bloqueador y al bloqueado
    io.to(blockerId).emit('user-blocked-success', { blockedId: blockedUserId });
    io.to(blockedUserId).emit('you-are-blocked', { blockerId });
    });

    socket.on('notify-unblock', ({ blockedUserId }) => {
    const unblockerId = userId;
    if (!unblockerId || !blockedUserId) return;

    io.to(unblockerId).emit('unblock-success', { blockedId: blockedUserId });
    io.to(blockedUserId).emit('you-are-unblocked', { unblockerId });
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
        if (!userId) {
            return
        } else if (userId) {
            (async () => {
                try {
                    // actualizamos el estado OFFLINE en la db
                    prisma.user.update({ 
                        where: { id: userId }, 
                        data: { online: false } 
                    });
                    // Notificamos a todos que este usuario está OFFLINE (tiempo real)
                    io.emit('user-status-change', { id: userId, online: false });
                    
                    const statusUser = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { online: true }
                    });
                    console.log(`El estado de ONLINE del usuario es: ${statusUser?.online}`);
                } catch (err: any) {
                    // El error de user.update puede ocurrir si el userId no existe o falla la DB.
                    console.error(`Error setting OFFLINE for ${userId}:`, err.message);
                }
            })();
        }
        console.log('Se desconecto socket con el usuario de ID: ', userId);

    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Socket Server escuchando en puerto ${PORT}`);
    // Log para confirmar que el health check está activo
    console.log(`🩺 Health check listo en: /api/health`);
});