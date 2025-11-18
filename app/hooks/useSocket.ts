import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { MessageType, UserStatusChange, MessageData } from '../types/chat';
import { useChatStore } from '@/store/chatStore';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL; 
let socketInstance: Socket | null = null;

export const useSocket = (userId: string) => {
  // Solo extraemos el estado de la UI que es una dependencia potencial del efecto
  const isChatOpen = useChatStore((state) => state.isChatOpen);

  useEffect(() => {

    const initializeSocket = () => {

      if (!userId || !SOCKET_SERVER_URL || socketInstance) return;
      
      socketInstance = io(SOCKET_SERVER_URL, {
        query: { userId }, // Pasar el ID del usuario para la sala y la lógica online/offline
        // Evitamos reconexiones si ya está conectado
        autoConnect: true,
        forceNew: false,
      });

      // --- Eventos de Conexión Básica ---
      socketInstance.on('connect', () => console.log('✅ Socket conectado.'));
      socketInstance.on('disconnect', () => console.log('❌ Socket desconectado.'));
      socketInstance.on('connect_error', (err) => console.error('⚠️ Error de conexión:', err.message));
      
      // --- Listeners de chat ---
      const store = useChatStore.getState();

      // Recibir nuevo mensaje
      socketInstance.on('receive-message', (message: MessageType) => {
        console.log('📩 Nuevo mensaje recibido. ID:', message.id);
        store.addMessage({ ...message, status: 'sent' }); // Recibido es siempre 'sent'
        
        // Si el chat está abierto, emitimos evento para marcar como leído
        if (store.isChatOpen) {
          socketInstance!.emit('message-read', { messageId: message.id, readerId: userId });
        }
      });
      
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
    return () => {};
    // Dependencias: userId y isChatOpen (para saber si emitir el 'read')
  }, [userId, isChatOpen]);

  // Función publica para enviar mensajes
  const sendMessage = (data: MessageData) => {
    // Obtenemos addMessage para el envio inmediato (Optimistic UI)
    const addMessageAction = useChatStore.getState().addMessage;

    if (!socketInstance || !userId) {
      console.error('⚠️ Socket no está conectado o el userId no está disponible.');
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
      senderId: userId,
      createdAt: new Date().toISOString(),
      readAt: null,
      deletedBy: null,
      status: 'pending',
    });

    // Emitimos el mensaje al servidor (incluyendo el localId temporal)
    socketInstance.emit('send-message', {
      ...data,
      senderId: userId,
      localId: localId, // Enviamos el ID temporal para que el servidor lo devuelva
    });
  }
  return { socket: socketInstance, sendMessage };
};