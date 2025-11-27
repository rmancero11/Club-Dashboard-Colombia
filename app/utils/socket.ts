import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL; 
let socket: Socket | null = null;

/**
 * Inicializa o recupera la instancia única del socket.
 * @param userId ID del usuario actual.
 * @returns La instancia de Socket.io.
 */
export const initializeSocket = (userId: string): Socket | null => {
    if (!SOCKET_SERVER_URL) {
        console.error('⚠️ NEXT_PUBLIC_SOCKET_SERVER_URL no está definido.');
        return null;
    }

    // // Si ya existe y está conectado o en proceso de conexión, lo reutilizamos.
    // if (socket && (socket.connected || socket.active)) {
    //     // Si el userId es diferente, forzamos la reconexión con el nuevo usuario
    //     if (socket.io.opts.query && socket.io.opts.query.userId !== userId) {
    //          console.log(`♻️ Reconectando socket por cambio de usuario: ${socket.io.opts.query.userId} -> ${userId}`);
    //          socket.disconnect();
    //          socket = null; // Fuerza una nueva instancia con el nuevo ID
    //     } else {
    //         return socket;
    //     }
    // }

    // Si ya existe y está conectado, lo reutilizamos.
    if (socket && socket.connected) { 
        // Si el userId es diferente, forzamos la reconexión con el nuevo usuario
        if (socket.io.opts.query && socket.io.opts.query.userId !== userId) {
            console.log(`♻️ Reconectando socket por cambio de usuario: ${socket.io.opts.query.userId} -> ${userId}`);
            socket.disconnect();
            socket = null; // Fuerza una nueva instancia con el nuevo ID
        } else {
            return socket;
        }
    }
    
    // // Crea la nueva instancia (o la primera)
    // socket = io(SOCKET_SERVER_URL, {
    //     query: { userId }, // Pasar el ID del usuario
    //     transports: ['websocket', 'polling'], // Prioriza WebSocket
    //     autoConnect: true,
    //     forceNew: false,
    // });

    // Crea la nueva instancia (o la primera)
    socket = io(SOCKET_SERVER_URL, {
        query: { userId }, // Pasar el ID del usuario
        transports: ['websocket', 'polling'], // Prioriza WebSocket
        autoConnect: true,
        forceNew: false,
        // --- Configuración de reconexión para mantener la conexión viva ---
        reconnection: true, // Habilitar reconexión (ya es true por defecto, pero explícito)
        reconnectionAttempts: Infinity, // Intentos ilimitados de reconexión
        reconnectionDelay: 1000, // Primer retardo (1 segundo)
        reconnectionDelayMax: 5000, // Máximo retardo (5 segundos)
        randomizationFactor: 0.5, // Para evitar que todos los clientes reconecten a la vez
        timeout: 60000, // Timeout de conexión inicial (60 segundos)
        // Coincidir el pingTimeout del servidor
        // Si el servidor usa 60000, el cliente debe usar 60000 o más (el cliente tiene un margen)
        // 🚨 Es crucial que este valor sea igual o mayor que el del servidor
        // En tu servidor el default es 20000. Si lo aumentaste a 60000, úsalo aquí.
        // Si lo dejaste en default, usa al menos 20000. Usaremos 60000 como buena práctica.
        // Ojo: Esto lo toma del servidor, pero ayuda a ser explícito.
        pingTimeout: 60000, 
    }as any);

    // --- Listeners de conexión ---
    socket.on('connect', () => console.log('✅ Socket conectado globalmente.'));
    socket.on('disconnect', (reason) => {
        console.log(`❌ Socket desconectado globalmente. Razón: ${reason}`)
    });
    socket.on('connect_error', (err) => console.error('⚠️ Error de conexión:', err.message));
    socket.on('reconnect_attempt', (attemptNumber) => console.log(`⏳ Intentando reconexión #${attemptNumber}...`));
    socket.on('reconnect', (attemptNumber) => console.log(`🎉 Reconexión exitosa después de ${attemptNumber} intentos.`));

    return socket;
};

// Obtiene la instancia de socket existente.
export const getSocket = (): Socket | null => socket;

// Función para cerrar y limpiar el socket (útil en logout).
export const closeSocket = () => {
    if (socket) {
        console.log('🔌 Cerrando y limpiando Socket...');
        socket.offAny(); // Elimina todos los listeners
        socket.disconnect();
        socket = null; 
    }
};