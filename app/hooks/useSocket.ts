import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { MessageType, UserStatusChange, MessageData } from '../types/chat';
import { useChatStore } from '@/store/chatStore';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL; 
let socketInstance: Socket | null = null;

export const sendMessage = (data: MessageData & { senderId: string }) => {
  const addMessageAction = useChatStore.getState().addMessage; 

  if (!socketInstance) {
    console.error('⚠️ Socket no está conectado.');
    return;
  }
  const localId = Date.now().toString(); // Generamos un ID temporal para la Optimistic UI

  // Agregamos el mensaje al estado de Zunstand inmediatamente con status 'pending'
  addMessageAction({
    // Propiedades de MessageData
    receiverId: data.receiverId,
    content: data.content,
    imageUrl: data.imageUrl ?? null,

    // Propiedades de MessageType
    id: localId, // Usamos el ID temporal como ID principal
    localId: localId, // Y el ID temporal como ID secundario
    senderId: data.senderId,
    createdAt: new Date().toISOString(),
    readAt: null,
    deletedBy: null,
    status: 'pending',
  } as MessageType); // Usamos MessageType para tipado temporal

  // Emitimos el mensaje al servidor (incluyendo el localId temporal)
  socketInstance.emit('send-message', {
    ...data,
    senderId: data.senderId,
    localId: localId, // Enviamos el ID temporal para que el servidor lo devuelva
  });
}

export const useSocket = (userId: string) => {
  // Solo extraemos el estado de la UI que es una dependencia potencial del efecto
  // const isChatOpen = useChatStore((state) => state.isChatOpen);

  useEffect(() => {

    const initializeSocket = () => {

      if (!userId || !SOCKET_SERVER_URL || socketInstance) return;
      
      socketInstance = io(SOCKET_SERVER_URL, {
        query: { userId }, // Pasar el ID del usuario para la sala y la lógica online/offline
        // Evitamos reconexiones si ya está conectado
        autoConnect: true,
        forceNew: false,
      });

      // --- Listeners de chat ---
      const store = useChatStore.getState();
      
      // Recibir nuevo mensaje
      socketInstance.on('receive-message', (message: MessageType) => {
        console.log('📩 Nuevo mensaje recibido. ID:', message.id);
        store.addMessage({ ...message, status: 'sent' }); // Recibido es siempre 'sent'
        
        // Si el chat está abierto, emitimos evento para marcar como leído
        if (useChatStore.getState().activeMatchId === message.senderId) {
          socketInstance!.emit('message-read', { messageId: message.id, readerId: userId });
        }
      });

      // --- Eventos de Conexión Básica ---
      socketInstance.on('connect', () => console.log('✅ Socket conectado.'));
      socketInstance.on('disconnect', () => console.log('❌ Socket desconectado.'));
      socketInstance.on('connect_error', (err) => console.error('⚠️ Error de conexión:', err.message));
      
      // Confirmación de lectura (cuando el otro usuario lo lee)
      socketInstance.on('message-marked-read', (data: { messageId: string }) => {
        store.markMessageAsRead(data.messageId);
      });
      
      // Actualizamos el estado ONLINE/OFFLINE
      socketInstance.on('user-status-change', (data: UserStatusChange) => {
        store.updateUserStatus(data.id, data.online);
      });
      
      // Confirmamos el envío de un mensaje (Optimistic UI)
      socketInstance.on('message-sent-success', (message: MessageType & { localId: string }) => {
        console.log('📤 Mensaje enviado con éxito y guardado. ID:', message.id);
        store.updateMessageStatus(message.localId, 'sent', message.id);
      });
      
      // Error del servidor 
      socketInstance.on('message-error', (data: { error: string, localId: string }) => {
        console.error('❌ Error al enviar mensaje:', data.error);
        store.updateMessageStatus(data.localId, 'failed');
      });
      // Fin del initializeSocket
    };
    initializeSocket();
    // Limpieza: No desconectamos el socket, pero removemos la función initializeSocket
    return () => {
      if (socketInstance) {
        console.log('🔌 Desconectando Socket...');
        // Eliminamos todos los listeners para evitar Memory Leaks
        socketInstance.offAny();
        socketInstance.disconnect();
        socketInstance = null; // Limpiamos la referencia global
      }
    };
    
  }, [userId]); // Solo se reconecta si el usuario cambia (logout/login)

  return {};
};