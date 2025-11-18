import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';


const PORT = process.env.PORT || 4000;
// Url del cliente (Vercel) para la configuración de CORS
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const prisma = new PrismaClient(); 
const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        // Permitir conexiones desde tu dominio de Vercel
        origin: [CLIENT_URL], // importante para la seguridad
        methods: ["GET", "POST"]
    }
});

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

    // Manejo de ENVÍO de MENSAJES
    socket.on('send-message', async (data: { senderId: string, receiverId: string, content: string, imageUrl?: string }) => {
        try {
            // Validamos Match ACEPTADO o Bloqueado antes de guardar
            const match = await prisma.match.findFirst({ where: { userAId: userId, userBId: data.receiverId } });
            if (!match) {
                console.log(`No se encontró un match para el usuario ${userId} con el usuario ${data.receiverId}`);
                return;
            }
            if (match.status !== 'ACCEPTED') {
                console.log(`El match no está aceptado para el usuario ${userId} con el usuario ${data.receiverId}`);
                return;
            }
            const blockedUser = await prisma.blockedUser.findFirst({ where: { blockerUserId: userId, blockedUserId: data.receiverId } });
            if (blockedUser) {
                console.log(`El usuario ${userId} está bloqueado para el usuario ${data.receiverId}`);
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