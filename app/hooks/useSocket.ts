import { useCallback, useEffect } from 'react';
import { MessageType, UserStatusChange, MessageData } from '../types/chat';
import { useChatStore } from '@/store/chatStore';
import { getSocket, initializeSocket } from '../utils/socket';

interface UseSocketReturn {
  sendMessage: (data: MessageData) => void;
  // deleteMessage: (messageId: string, receiverId: string) => void;
  deleteMessage: (messageId: string, matchId: string) => Promise<void>;
  deleteConversation: (matchId: string) => Promise<void>;
  blockUser: (blockedUserId: string) => void;
  unblockUser: (blockedUserId: string) => void;
  markMessagesAsRead: (matchId: string) => void;
}

export const useSocket = (
  userId: string, 
  isExpanded: boolean, 
  reloadMatches: () => void
): UseSocketReturn => {

  // Obtenemos la instancia global si existe
  const socketInstance = getSocket();

  // Helper para acceder a store acciones
  const store = useChatStore.getState();

  // // --- Función estable para marcar mensajes como leídos ---
  // const markMessagesAsRead = useCallback((matchId: string) => {
  //   if (!socketInstance || !userId) return;
  //   socketInstance.emit('mark-messages-read', matchId);
  // }, [userId, socketInstance]); // Agregamos socketInstance como dependencia

  // ------- Mark AS READ (emit) --------
  const markMessagesAsRead = useCallback(
    (matchId: string) => {
      const sock = getSocket();
      if (!sock || !userId) return;
      sock.emit("mark-messages-read", matchId);
    },
    [userId]
  );

  useEffect(() => {
    // 1. Inicializamos socket (si existe, retorna la misma instancia)
    const currentSocket = initializeSocket(userId);
    // Si no hay socket (ej: no hay userId o URL), salimos
    if (!currentSocket) return;

    // --- Listeners de chat ---
    const store = useChatStore.getState();
    
    // // Evento de Éxito de Bloqueo
    // socketInstance.on('block-success', (data: { blockedId: string }) => {
    //   // 1. Avisa al usuario bloqueador (User1)
    //   alert('✅ Usuario bloqueado exitosamente.'); 
    //   // 2. Actualiza el estado local (isBlockedByMe = true)
    //   store.updateBlockStatus(data.blockedId, true);
    //   // 3. Recarga la lista de matches para eliminar el chat de la lista
    //   reloadMatches();
    // });

    // --- LISTENERS (definidos como funciones para off en cleanup) ---
    const onUserBlockedSuccess = (data: { blockedId: string }) => {
      // Actualizamos UI local y recargamos matches
      store.updateBlockStatus(data.blockedId, true);
      reloadMatches();
      // opcional: notificar al usuario
      try { window.alert('✅ Usuario bloqueado exitosamente.'); } catch {}
      // cerrar chat si estaba abierto con ese usuario
      store.setActiveChat(null);
    };

    // Evento de Éxito de bloqueo
    // const onBlockSuccess = (data: { blockedId: string }) => {
    //   alert('✅ Usuario bloqueado exitosamente.'); 
    //   store.updateBlockStatus(data.blockedId, true);
    //   reloadMatches();
    // };

    // // Evento de Éxito de Desbloqueo
    // socketInstance.on('unblock-success', (data: { blockedId: string }) => {
    //   // 1. Avisa al usuario desbloqueador (User1)
    //   alert('✅ Usuario desbloqueado exitosamente.'); 
    //   // 2. Actualiza el estado local (isBlockedByMe = false)
    //   store.updateBlockStatus(data.blockedId, false);
    //   // 3. Recarga la lista de matches para eliminar el chat de la lista
    //   reloadMatches();
    // });

    const onUnblockSuccess = (data: { blockedId: string }) => {
      store.updateBlockStatus(data.blockedId, false);
      reloadMatches();
      try { window.alert('✅ Usuario desbloqueado exitosamente.'); } catch {}
    };

    // Evento de Éxito de Desbloqueo
    // const onUnblockSuccess = (data: { blockedId: string }) => {
    //   alert('✅ Usuario desbloqueado exitosamente.'); 
    //   store.updateBlockStatus(data.blockedId, false);
    //   reloadMatches();
    // };

    // // Evento si el usuario actual es bloqueado por otro (User2)
    // socketInstance.on('you-are-blocked', (data: { blockerId: string }) => {
    //   alert(`❌ Has sido bloqueado por un usuario. Tu lista de chats se ha actualizado.`);
    //   // 1. Recargamos la lista de matches para filtrar al usuario que te bloqueó
    //   reloadMatches();
    //   // 2. Cerramos la ventana de chat si estaba abierta con él
    //   store.setActiveChat(null);
    // });

    // Evento si el usuario actual es bloqueado por otro (User2)
    const onYouAreBlocked = (data: { blockerId: string }) => {
      // alert(`❌ Has sido bloqueado por un usuario. Tu lista de chats se ha actualizado.`);
      try { window.alert('❌ Has sido bloqueado por un usuario. Tu lista de chats se ha actualizado.'); } catch {}
      reloadMatches();
      store.setActiveChat(null);
    };

    // // Recibir nuevo mensaje
    // socketInstance.on('receive-message', (message: MessageType) => {
    //   console.log('📩 Nuevo mensaje recibido. ID:', message.id);
    //   store.addMessage({ ...message, status: 'sent' }); // Recibido es siempre 'sent'
      
    //   // Verificamos si el modal está expandido Y el chat activo es el de este remitente
    //   const isCurrentChat = store.activeMatchId === message.senderId;

    //   if (store.isExpanded && isCurrentChat) {
    //     // Si estamos viendo la conversación, lo marcamos como leído en el servidor
    //     markMessagesAsRead(message.senderId); // Usamos la función local
    //   }
    //   // // Si el chat está abierto, emitimos evento para marcar como leído
    //   // if (store.activeMatchId === message.senderId && store.isExpanded) {
    //   //   socketInstance?.emit('message-read', { 
    //   //     messageId: message.id, 
    //   //     readerId: userId,
    //   //     senderId: message.senderId
    //   //   });
    //   // }
    // });

    // Recibir nuevo mensaje
    const onReceiveMessage = (message: MessageType) => {
      console.log('📩 Nuevo mensaje recibido. ID:', message.id);
      store.addMessage({ ...message, status: 'sent' });
      
      const isCurrentChat = store.activeMatchId === message.senderId;

      if (store.isExpanded && isCurrentChat) {
        markMessagesAsRead(message.senderId);
      }
    };
    
    // // Confirmamos el envío de un mensaje
    // socketInstance.on('message-sent-success', (message: MessageType & { localId: string }) => {
    //   console.log('📤 Mensaje enviado con éxito y guardado. ID:', message.id);
    //   store.updateMessageStatus(message.localId, 'sent', message.id);

    //   // Ya que se envió un nuevo mensaje, recargamos la lista de matches
    //   reloadMatches();
    // });

    // Confirmamos el envío de un mensaje
    // const onMessageSentSuccess = (message: MessageType & { localId: string }) => {
    //   console.log('📤 Mensaje enviado con éxito y guardado. ID:', message.id);
    //   store.updateMessageStatus(message.localId, 'sent', message.id);
    //   reloadMatches();
    // };

    const onMessageSentSuccess = (message: MessageType & { localId?: string }) => {
      // Actualizamos estado del mensaje local (optimistic)
      if (message.localId) {
        store.updateMessageStatus(message.localId, 'sent', message.id);
      }
      reloadMatches();
    };

    // // Notificación de error en el envío
    // socketInstance.on('message-error', (data: { error: string, localId?: string }) => {
    //   console.error('❌ Error al enviar mensaje:', data.error);
    //   if (data.localId){
    //     store.updateMessageStatus(data.localId, 'failed');
    //   }
    // });

    // Notificación de error en el envío
    const onMessageError = (data: { error: string, localId?: string }) => {
      console.error('❌ Error al enviar mensaje:', data.error);
      if (data.localId){
        store.updateMessageStatus(data.localId, 'failed');
      }
    };

    // // Evento de eliminación de mensaje
    // socketInstance.on('message-deleted', (data: { messageId: string, receiverId: string, userId: string }) => {
    //   // Verifica si el mensaje es de la conversación actual (donde el receiver es el match)
    //   if (store.activeMatchId === data.userId) {
    //     store.removeMessage(data.messageId);
    //   }
    // });

    // Evento de eliminación de mensaje
    // Payload esperado: { messageId: string, deletedBy: string, matchId?: string, receiverId?: string }
    const onMessageDeleted = (data: { messageId: string; deletedBy: string; matchId?: string }) => {
      // Aplicamos la eliminación local SOLO si el deletedBy es este usuario (sincronización multi-dispositivo).
      if (data.deletedBy === userId) {
        store.removeMessage(data.messageId, userId);
      }
    };

    // Event: conversation-deleted
    // Payload esperado: { matchId: string, deletedBy: string }
    const onConversationDeleted = (data: { matchId: string; deletedBy: string }) => {
      if (data.deletedBy === userId) {
        store.removeConversation(data.matchId, userId);
      }
    };

    // const onMessageDeleted = (data: { messageId: string, receiverId: string, userId: string }) => {
    //   if (store.activeMatchId === data.userId) {
    //     store.removeMessage(data.messageId);
    //   }
    // };

    // // Evento que notifica que los mensajes que enviaste han sido leídos por el receptor
    // socketInstance.on('messages-read-by-receiver', (data: { readerId: string, senderId: string }) => {
    // const markMessagesAsReadAction = useChatStore.getState().markMessagesAsRead;
  
    //   // Solo actualizamos si el que leyó es el match y el que envió soy yo (senderId)
    //   if (data.senderId === userId) {
    //     markMessagesAsReadAction(data.readerId);
    //   }
    // });

    // Evento que notifica que los mensajes que enviaste han sido leídos por el receptor
    const onMessagesReadByReceiver = (data: { readerId: string, senderId: string }) => {
      // const markMessagesReadAction = useChatStore.getState().markMessagesAsRead;
      
      // Si soy el sender original, marcá como leídos los mensajes que enviaste al readerId
      if (data.senderId === userId) {
        // markMessagesReadAction(data.readerId);
        useChatStore.getState().markMessageAsRead(data.readerId);
      }
    };
    
    // // Confirmación de lectura (cuando el otro usuario lo lee)
    // socketInstance.on('message-marked-read', (data: { messageId: string }) => {
    //   store.markMessageAsRead(data.messageId);
    // });
    
    // Confirmación de lectura (cuando el otro usuario lo lee)
    const onMessageMarkedRead = (data: { messageId: string }) => {
      store.markMessageAsRead(data.messageId);
    };

    // // Actualizamos el estado ONLINE/OFFLINE
    // socketInstance.on('user-status-change', (data: UserStatusChange) => {
    //   store.updateUserStatus(data.id, data.online);
    // });

    // Actualizamos el estado ONLINE/OFFLINE
    const onUserStatusChange = (data: UserStatusChange) => {
      store.updateUserStatus(data.id, data.online);
    };
    
    //   // Fin del initializeSocket
    // initializeSocket();
    
    // 2. Registramos todos los listeners
    currentSocket.on('user-blocked-success', onUserBlockedSuccess);
    currentSocket.on('unblock-success', onUnblockSuccess);
    currentSocket.on('you-are-blocked', onYouAreBlocked);

    currentSocket.on('receive-message', onReceiveMessage);
    currentSocket.on('message-sent-success', onMessageSentSuccess);
    currentSocket.on('message-error', onMessageError);

    currentSocket.on('message-deleted', onMessageDeleted);
    currentSocket.on('conversation-deleted', onConversationDeleted);
    
    currentSocket.on('messages-read-by-receiver', onMessagesReadByReceiver);
    currentSocket.on('message-marked-read', onMessageMarkedRead);
    
    currentSocket.on('user-status-change', onUserStatusChange);



    // // Limpieza: No desconectamos el socket, pero removemos la función initializeSocket
    // return () => {
    //   if (socketInstance) {
    //     console.log('🔌 Desconectando Socket...');
    //     // Eliminamos todos los listeners para evitar Memory Leaks
    //     socketInstance.offAny();
    //     socketInstance.disconnect();
    //     socketInstance = null; // Limpiamos la referencia global
    //   }
    // };

    // 3. Limpieza (CLEANUP): **SOLO eliminamos los listeners, NO la conexión global.**
    return () => {
      // Removemos todos los listeners para evitar duplicados y memory leaks
      currentSocket.off('user-blocked-success', onUserBlockedSuccess);
      currentSocket.off('unblock-success', onUnblockSuccess);
      currentSocket.off('you-are-blocked', onYouAreBlocked);

      currentSocket.off('receive-message', onReceiveMessage);
      currentSocket.off('message-sent-success', onMessageSentSuccess);
      currentSocket.off('message-error', onMessageError);
      
      currentSocket.off('message-deleted', onMessageDeleted);
      currentSocket.off('conversation-deleted', onConversationDeleted);

      currentSocket.off('messages-read-by-receiver', onMessagesReadByReceiver);
      currentSocket.off('message-marked-read', onMessageMarkedRead);

      currentSocket.off('user-status-change', onUserStatusChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, reloadMatches, markMessagesAsRead]); // Solo se reconecta si el usuario cambia (logout/login)

  // --- Funciones de comunicación hacia el servidor (Emits) ---

  // -------- SEND MESSAGE (Optimistic) --------
  const sendMessage = useCallback(
    (data: MessageData) => {
      const sock = getSocket();
      if (!sock || !userId) {
        console.error('Socket no conectado o userId nulo.');
        return;
      }

      const localId = Date.now().toString();

      // Optimistic add
      store.addMessage({
        id: localId,
        localId,
        senderId: userId,
        receiverId: data.receiverId,
        content: data.content,
        imageUrl: data.imageUrl ?? null,
        createdAt: new Date().toISOString(),
        readAt: null,
        deletedBy: null,
        status: 'pending'
      } as MessageType);

      // Emitir al server
      sock.emit('send-message', {
        ...data,
        senderId: userId,
        localId
      });
    },
    [userId, store]
  );

  // --- DELETE SINGLE MESSAGE ---
  // Lógica: Optimistic update local -> llamar API PATCH -> emitir evento socket para sincronizar otras sesiones
  const deleteMessage = useCallback(
    async (messageId: string, matchId: string) => {
      if (!userId) return;

      const sock = getSocket();

      // Optimistic: marcar borrado localmente para este usuario
      store.removeMessage(messageId, userId);

      try {
        const res = await fetch(`/api/chat/messages/${messageId}/delete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          // rollback simple: recargar historial o informar al usuario
          console.error('API delete message failed', await res.text());
          // optional: podrías recargar los mensajes desde la API aquí
          try { window.alert('No se pudo eliminar el mensaje. Intenta de nuevo.'); } catch {}
          return;
        }

        // Notificar al socket para sincronizar otras sesiones del mismo usuario (y/o backend)
        // Payload: messageId, deletedBy, matchId (matchId = otro usuario de la conversación)
        if (sock) {
          sock.emit('message-deleted', {
            messageId,
            deletedBy: userId,
            matchId,
            receiverId: matchId
          });
        }
      } catch (err) {
        console.error('Error deleting message:', err);
        try { window.alert('No se pudo eliminar el mensaje.'); } catch {}
      }
    },
    [userId, store]
  );
  
  // Función publica para enviar mensajes
  // const sendMessage = (data: MessageData) => {
  //   const addMessageAction = useChatStore.getState().addMessage; 

  //   if (!socketInstance) {
  //     console.error('⚠️ Socket no está conectado.');
  //     return;
  //   }
  //   const localId = Date.now().toString(); // Generamos un ID temporal para la Optimistic UI

  //   // Agregamos el mensaje al estado de Zunstand inmediatamente con status 'pending'
  //   addMessageAction({
  //     // Propiedades de MessageData
  //     receiverId: data.receiverId,
  //     content: data.content,
  //     imageUrl: data.imageUrl ?? null,

  //     // Propiedades de MessageType
  //     id: localId, // Usamos el ID temporal como ID principal
  //     localId: localId, // Y el ID temporal como ID secundario
  //     senderId: userId,
  //     createdAt: new Date().toISOString(),
  //     readAt: null,
  //     deletedBy: null,
  //     status: 'pending',
  //   } as MessageType); // Usamos MessageType para tipado temporal

  //   // Emitimos el mensaje al servidor (incluyendo el localId temporal)
  //   socketInstance.emit('send-message', {
  //     ...data,
  //     senderId: userId,
  //     localId: localId, // Enviamos el ID temporal para que el servidor lo devuelva
  //   });
  // }

  // Función para eliminar un mensaje
  // const deleteMessage = (messageId: string, receiverId: string) => {
  //   if (!socketInstance || !userId) return;

  //   socketInstance.emit('delete-message', {
  //     messageId: messageId,
  //     userId: userId,
  //     matchId: receiverId,
  //   });
  // }

  // --- DELETE CONVERSATION ---
  // Similar: optimistic local -> API PATCH -> socket emit
  const deleteConversation = useCallback(
    async (matchId: string) => {
      if (!userId) return;

      const sock = getSocket();

      // Optimistic local
      store.removeConversation(matchId, userId);

      try {
        const res = await fetch(`/api/chat/history/${matchId}/delete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          console.error('API delete conversation failed', await res.text());
          try { window.alert('No se pudo eliminar la conversación. Intenta de nuevo.'); } catch {}
          return;
        }

        // Emitir evento para sincronizar otras sesiones
        if (sock) {
          sock.emit('conversation-deleted', {
            matchId,
            deletedBy: userId,
            receiverId: matchId
          });
        }

        // También reseteamos unread en matches local (ya lo hace removeConversation, pero por si acaso)
        useChatStore.setState((s) => ({
          matches: s.matches.map((m) => (m.id === matchId ? { ...m, unreadCount: 0 } : m))
        }));
      } catch (err) {
        console.error('Error deleting conversation:', err);
        try { window.alert('No se pudo eliminar la conversación.'); } catch {}
      }
    },
    [userId, store]
  );

  // // Función para bloquear un usuario
  // const blockUser = (blockedUserId: string) => {
  //   if (socketInstance) {
  //     // Pedimos confirmación al usuario antes de bloquear
  //     if (window.confirm(`⚠️ ¿Estás seguro de que quieres bloquear a este usuario?`)) {
  //       socketInstance.emit('block-user', { blockedUserId: blockedUserId });
  //     }
  //   }
  //   useChatStore.getState().setActiveChat(null);
  // };

  // // Función para desbloquear un usuario
  // const unblockUser = (blockedUserId: string) => {
  //   if (socketInstance) {
  //     if (window.confirm(`⚠️ ¿Estás seguro de que quieres desbloquear a este usuario?`)) {
  //       socketInstance.emit('unblock-user', { blockedUserId: blockedUserId });
  //     }
  //   }
  // };

  // --- BLOCK / UNBLOCK ---
  const blockUser = useCallback(
    (blockedUserId: string) => {
      const sock = getSocket();
      if (!sock || !userId) return;

      if (!window.confirm('⚠️ ¿Estás seguro de que quieres bloquear a este usuario?')) return;

      sock.emit('block-user', { blockedUserId });

      // cerrar chat local
      store.setActiveChat(null);
    },
    [userId, store]
  );

  const unblockUser = useCallback(
    (blockedUserId: string) => {
      const sock = getSocket();
      if (!sock || !userId) return;

      if (!window.confirm('⚠️ ¿Estás seguro de que quieres desbloquear a este usuario?')) return;

      sock.emit('unblock-user', { blockedUserId });
    },
    [userId]
  );

  return { 
    sendMessage,
    deleteMessage,
    deleteConversation,
    blockUser,
    unblockUser,
    markMessagesAsRead,
  };
};