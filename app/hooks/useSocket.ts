import { io, Socket } from 'socket.io-client';
import { use, useCallback, useEffect } from 'react';
import { MessageType, UserStatusChange, MessageData } from '../types/chat';
import { useChatStore } from '@/store/chatStore';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL; 
let socketInstance: Socket | null = null;

interface UseSocketReturn {
  sendMessage: (data: MessageData) => void;
  deleteMessage: (messageId: string, receiverId: string) => void;
  blockUser: (blockedUserId: string) => void;
  unblockUser: (blockedUserId: string) => void;
  // markMessageAsRead: (matchId: string) => void;
  markMessagesAsRead: (matchId: string) => void;
}

export const useSocket = (
  userId: string, 
  isExpanded: boolean, 
  reloadMatches: () => void
): UseSocketReturn => {

  // --- Función estable para marcar mensajes como leídos ---
  const markMessagesAsRead = useCallback((matchId: string) => {
    if (!socketInstance || !userId) return;
    socketInstance.emit('mark-messages-read', matchId);
  }, [userId]);

  useEffect(() => {

    const initializeSocket = () => {

      if (!userId || !SOCKET_SERVER_URL || socketInstance || !reloadMatches) return;
      
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
      
      // Evento de Éxito de Bloqueo
      socketInstance.on('block-success', (data: { blockedId: string }) => {
        // 1. Avisa al usuario bloqueador (User1)
        alert('✅ Usuario bloqueado exitosamente.'); 
        // 2. Actualiza el estado local (isBlockedByMe = true)
        store.updateBlockStatus(data.blockedId, true);
        // 3. Recarga la lista de matches para eliminar el chat de la lista
        reloadMatches();
      });

      // Evento de Éxito de Desbloqueo
      socketInstance.on('unblock-success', (data: { blockedId: string }) => {
        // 1. Avisa al usuario desbloqueador (User1)
        alert('✅ Usuario desbloqueado exitosamente.'); 
        // 2. Actualiza el estado local (isBlockedByMe = false)
        store.updateBlockStatus(data.blockedId, false);
        // 3. Recarga la lista de matches para eliminar el chat de la lista
        reloadMatches();
      });

      // Evento si el usuario actual es bloqueado por otro (User2)
      socketInstance.on('you-are-blocked', (data: { blockerId: string }) => {
        alert(`❌ Has sido bloqueado por un usuario. Tu lista de chats se ha actualizado.`);
        // 1. Recargamos la lista de matches para filtrar al usuario que te bloqueó
        reloadMatches();
        // 2. Cerramos la ventana de chat si estaba abierta con él
        store.setActiveChat(null);
      });

      // Recibir nuevo mensaje
      socketInstance.on('receive-message', (message: MessageType) => {
        console.log('📩 Nuevo mensaje recibido. ID:', message.id);
        store.addMessage({ ...message, status: 'sent' }); // Recibido es siempre 'sent'
        
        // Verificamos si el modal está expandido Y el chat activo es el de este remitente
        const isCurrentChat = store.activeMatchId === message.senderId;

        if (store.isExpanded && isCurrentChat) {
          // Si estamos viendo la conversación, lo marcamos como leído en el servidor
          markMessagesAsRead(message.senderId); // Usamos la función local
        }
        // // Si el chat está abierto, emitimos evento para marcar como leído
        // if (store.activeMatchId === message.senderId && store.isExpanded) {
        //   socketInstance?.emit('message-read', { 
        //     messageId: message.id, 
        //     readerId: userId,
        //     senderId: message.senderId
        //   });
        // }
      });
      
      // Confirmamos el envío de un mensaje
      socketInstance.on('message-sent-success', (message: MessageType & { localId: string }) => {
        console.log('📤 Mensaje enviado con éxito y guardado. ID:', message.id);
        store.updateMessageStatus(message.localId, 'sent', message.id);

        // Ya que se envió un nuevo mensaje, recargamos la lista de matches
        reloadMatches();
      });

      // Notificación de error en el envío
      socketInstance.on('message-error', (data: { error: string, localId?: string }) => {
        console.error('❌ Error al enviar mensaje:', data.error);
        if (data.localId){
          store.updateMessageStatus(data.localId, 'failed');
        }
      });

      // Evento de eliminación de mensaje
      socketInstance.on('message-deleted', (data: { messageId: string, receiverId: string, userId: string }) => {
        // Verifica si el mensaje es de la conversación actual (donde el receiver es el match)
        if (store.activeMatchId === data.userId) {
          store.removeMessage(data.messageId);
        }
      });

      // Evento que notifica que los mensajes que enviaste han sido leídos por el receptor
      socketInstance.on('messages-read-by-receiver', (data: { readerId: string, senderId: string }) => {
      const markMessagesAsReadAction = useChatStore.getState().markMessagesAsRead;
    
        // Solo actualizamos si el que leyó es el match y el que envió soy yo (senderId)
        if (data.senderId === userId) {
          markMessagesAsReadAction(data.readerId);
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
    
  }, [userId, reloadMatches, markMessagesAsRead]); // Solo se reconecta si el usuario cambia (logout/login)

  // --- Funciones de comunicación hacia el servidor (Emits) ---

  // Función publica para enviar mensajes
  const sendMessage = (data: MessageData) => {
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
      senderId: userId,
      createdAt: new Date().toISOString(),
      readAt: null,
      deletedBy: null,
      status: 'pending',
    } as MessageType); // Usamos MessageType para tipado temporal

    // Emitimos el mensaje al servidor (incluyendo el localId temporal)
    socketInstance.emit('send-message', {
      ...data,
      senderId: userId,
      localId: localId, // Enviamos el ID temporal para que el servidor lo devuelva
    });
  }

  // Función para eliminar un mensaje
  const deleteMessage = (messageId: string, receiverId: string) => {
    if (!socketInstance || !userId) return;

    socketInstance.emit('delete-message', {
      messageId: messageId,
      userId: userId,
      matchId: receiverId,
    });
  }

  // Función para bloquear un usuario
  const blockUser = (blockedUserId: string) => {
    if (socketInstance) {
      // Pedimos confirmación al usuario antes de bloquear
      if (window.confirm(`⚠️ ¿Estás seguro de que quieres bloquear a este usuario?`)) {
        socketInstance.emit('block-user', { blockedUserId: blockedUserId });
      }
    }
    useChatStore.getState().setActiveChat(null);
  };

  // Función para desbloquear un usuario
  const unblockUser = (blockedUserId: string) => {
    if (socketInstance) {
      if (window.confirm(`⚠️ ¿Estás seguro de que quieres desbloquear a este usuario?`)) {
        socketInstance.emit('unblock-user', { blockedUserId: blockedUserId });
      }
    }
  };

  return { sendMessage, deleteMessage, blockUser, markMessagesAsRead, unblockUser };
};