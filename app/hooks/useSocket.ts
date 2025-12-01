import { useCallback, useEffect } from 'react';
import { MessageType, UserStatusChange, MessageData } from '../types/chat';
import { useChatStore } from '@/store/chatStore';
import { getSocket, initializeSocket } from '../utils/socket';

interface UseSocketReturn {
  sendMessage: (data: MessageData) => void;
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

    // Evento de Éxito de Desbloqueo
    const onUnblockSuccess = (data: { blockedId: string }) => {
      store.updateBlockStatus(data.blockedId, false);
      reloadMatches();
      try { window.alert('✅ Usuario desbloqueado exitosamente.'); } catch {}
    };


    // Evento si el usuario actual es bloqueado por otro (User2)
    const onYouAreBlocked = (data: { blockerId: string }) => {
      // alert(`❌ Has sido bloqueado por un usuario. Tu lista de chats se ha actualizado.`);
      try { window.alert('❌ Has sido bloqueado por un usuario. Tu lista de chats se ha actualizado.'); } catch {}
      reloadMatches();
      store.setActiveChat(null);
    };


    // Recibir nuevo mensaje
    const onReceiveMessage = (message: MessageType) => {
      console.log('📩 Nuevo mensaje recibido. ID:', message.id);
      store.addMessage({ ...message, status: 'sent' });
      
      const isCurrentChat = store.activeMatchId === message.senderId;

      if (store.isExpanded && isCurrentChat) {
        markMessagesAsRead(message.senderId);
      }
    };
 

    const onMessageSentSuccess = (message: MessageType & { localId?: string }) => {
      // Actualizamos estado del mensaje local (optimistic)
      if (message.localId) {
        store.updateMessageStatus(message.localId, 'sent', message.id);
      }
      reloadMatches();
    };


    // Notificación de error en el envío
    const onMessageError = (data: { error: string, localId?: string }) => {
      console.error('❌ Error al enviar mensaje:', data.error);
      if (data.localId){
        store.updateMessageStatus(data.localId, 'failed');
      }
    };


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


    // Evento que notifica que los mensajes que enviaste han sido leídos por el receptor
    const onMessagesReadByReceiver = (data: { readerId: string, senderId: string }) => {
      // const markMessagesReadAction = useChatStore.getState().markMessagesAsRead;
      
      // Si soy el sender original, marcá como leídos los mensajes que enviaste al readerId
      if (data.senderId === userId) {
        // markMessagesReadAction(data.readerId);
        useChatStore.getState().markMessageAsRead(data.readerId);
      }
    };

    
    // Confirmación de lectura (cuando el otro usuario lo lee)
    const onMessageMarkedRead = (data: { messageId: string }) => {
      store.markMessageAsRead(data.messageId);
    };


    // Actualizamos el estado ONLINE/OFFLINE
    const onUserStatusChange = (data: UserStatusChange) => {
      store.updateUserStatus(data.id, data.online);
    };
    
    
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