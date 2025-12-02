import { create } from 'zustand';
import { MessageStatus, MessageType } from '@/app/types/chat';

// Definimos la estructura de un Match Contacto
export interface MatchContact {
  id: string;
  name: string | null;
  avatar: string;
  lastMessageContent: string | null;
  lastMessageAt: Date | string | null;
  online?: boolean;
  country?: string | null;
  birthday?: Date | string | null;
  gender?: string | null; 
  isBlockedByMe: boolean;
  unreadCount?: number;
}

// Definimos la interfaz del estado de la tienda
export interface ChatStore {
  // Estado de la UI
  isExpanded: boolean; // Controlamos si el modal está expandido. False si está minimizado
  activeMatchId: string | null; // ID del match que se está visiualizando (cuando se abre la ventana)
  // Datos
  isModalOpen: boolean;

  // Estado de carga
  isLoadingMatches: boolean;

  messages: MessageType[];
  matches: MatchContact[]; // Lista de contactos con los que se puede chatear
  onlineUsers: Record<string, boolean>; // Mapeo de userId a estado (true/false)
  likesSent: string[]; // Lista de userIds que se han enviado likes
  likesReceived: string[]; // Lista de userIds que se han recibido likes
  
  // Acciones de UI 
  openModal: () => void;
  closeModal: () => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setActiveChat: (matchId: string | null) => void;

  // Acciones de datos
  setMatches: (matchList: MatchContact[]) => void;
  setMessages: (msgs: MessageType[]) => void;
  prependMessages: (msgs: MessageType[]) => void;
  addMessage: (msg: MessageType) => void;
  upsertMessages: (msgs: MessageType[]) => void;

  // ACCIÓN DE CARGA
  setIsLoadingMatches: (isLoading: boolean) => void
  
  // Actualizamos el estado de un mensaje (logica de Optimistic UI)
  updateMessageStatus: (localId: string, newStatus: MessageStatus, prismaId?: string) => void;
  
  // Marcamos un mensaje como leído
  markMessageAsRead: (messageId: string) => void;
  markMessagesAsRead: (matchId: string) => void;

  // Reacciones al realtime de borrado
  deleteMessageRealtime: (messageId: string, userId: string) => void;
  deleteConversationRealtime: (matchId: string, userId: string) => void;
  deleteConversationAndMatch: (matchId: string, currentUserId: string) => Promise<boolean>;

  setLikesSent: (userIds: string[]) => void;
  setLikesReceived: (userIds: string[]) => void;
  
  // Optimistic/local (ver APIs)
  removeMessage: (messageId: string, userId: string) => void;
  removeConversation: (matchId: string, userId: string) => void;
  
  updateUserStatus: (id: string, online: boolean) => void;
  updateBlockStatus: (blockedId: string, isBlocked: boolean) => void;
  
  getUnreadCount: (matchId: string) => number;
  getTotalUnread: () => number;
  resetChat: () => void;
}

const initialChatState = {
    // Estado inicial
  isExpanded: false,
  activeMatchId: null,
  isModalOpen: false,
  isLoadingMatches: true,

  messages: [],
  matches: [],
  onlineUsers: {},
  likesSent: [],
  likesReceived: [],
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  ...initialChatState,

  // UI
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setIsExpanded: (isExpanded) => set({ isExpanded: isExpanded }),

  setActiveChat: (matchId) => {
    const state = get();

    if (matchId) {
      // Marcamos todos los mensajes de esa conversación como leídos
      state.markMessagesAsRead(matchId);

      // 👉 Reset de unreadCount solo de ese match
      set({
        activeMatchId: matchId,
        isExpanded: true,
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, unreadCount: 0 } : m
        )
      });
    } else {
      set({ activeMatchId: null });
    }
  },

  // ACCIÓN DE CARGA
  setIsLoadingMatches: (isLoading) => set({ isLoadingMatches: isLoading }),

  // ------- Acciones de datos -------
  setMatches: (matchList) =>
  set({
    matches: matchList.map((m) => ({
      ...m,
      unreadCount: m.unreadCount ?? 0 // 👉 asegurar campo
    })),
    isLoadingMatches: false
  }),

  setMessages: (msgs) => set({ messages: msgs }),

  // prependMessages: (msgs) => set((state) => ({ messages: [...msgs, ...state.messages] })),
  prependMessages: (msgs) => {
    get().upsertMessages(msgs);
  },


  upsertMessages: (newMessages: MessageType[]) =>
  set((state) => {
    // Usamos un mapa para la deduplicación por ID de Prisma o localId
    const messagesMap = new Map<string, MessageType>();
      
    // 1. Insertamos los existentes
    state.messages.forEach((msg) => {
      const key = msg.id || msg.localId;
      if (key) messagesMap.set(key, msg);
    });

    // 2. Insertamos/Actualizamos los nuevos (sobrescribirán si tienen el mismo id/localId)
    newMessages.forEach((msg) => {
      const key = msg.id || msg.localId;
      if (key) messagesMap.set(key, msg);
    });
        
    // 3. Convertimos a array y ordenamos CRONOLÓGICAMENTE (más viejo al inicio)
    const merged = Array.from(messagesMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return { messages: merged };
  }),  


  addMessage: (msg) =>
    set((state) => {
    const existingMessage = state.messages.find(m => m.id && m.id === msg.id);

    if (existingMessage) {
      // Si ya existe, simplemente mantenemos el estado actual o actualizamos.
      // Aquí solo lo mantenemos para evitar duplicados.
      return state; 
    }
    // Identificamos el otro usuario (el que envió el mensaje)
    const senderId = msg.senderId;

    const isChatOpen = state.activeMatchId === senderId;
    const updatedMatches = state.matches.map((m) => {
      if (m.id === senderId) {
        return { 
          ...m, 
          // ⭐️ AJUSTE CLAVE: Actualizar el contenido y la hora del último mensaje
          lastMessageContent: msg.content, 
          lastMessageAt: msg.createdAt,
          // Incrementar unreadCount solo si el chat NO está abierto
          unreadCount: isChatOpen ? 0 : (m.unreadCount ?? 0) + 1 
        };
      }
      return m;
    });
        
    // 3. Ordenar la lista de matches para que el nuevo mensaje aparezca arriba
    // La ordenación debe hacerse basándose en `lastMessageAt`
    const sortedMatches = updatedMatches.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || 0).getTime();
      const dateB = new Date(b.lastMessageAt || 0).getTime();
      return dateB - dateA; // Orden descendente (más reciente primero)
    });

    return {
      messages: [...state.messages, msg],
      matches: sortedMatches, // Devolvemos la lista ordenada
    };
    // 2. Lógica de mensajes no leídos y actualización de matchContact


    // 2. Lógica de mensajes no leídos y actualización de matchContact
    //     const updatedMatches = !isChatOpen
    //     ? state.matches.map((m) => 
    //       m.id === msg.senderId
    //       ? { ...m, unreadCount: (m.unreadCount ?? 0) + 1 }
    //       : m
    //     )
    //     : state.matches;
    //     
    //     return {
    //       messages: [...state.messages, msg],
    //       matches: updatedMatches
    //     };
  }),
    
  updateMessageStatus: (localId, newStatus, prismaId) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.localId === localId
        ? { ...msg, status: newStatus, id: prismaId ?? msg.id }
        : msg
      )
  })),
    
  markMessageAsRead: (messageId) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId
        ? { ...msg, readAt: new Date().toISOString() }
        : msg
    )
  })),
  
  markMessagesAsRead: (matchId) => set((state) => ({
    messages: state.messages.map((msg) =>
        msg.senderId === matchId && !msg.readAt
          ? { ...msg, readAt: new Date().toISOString() }
          : msg
      )
  })),
    
  deleteMessageRealtime: (messageId, userId) =>
    set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId
      ? {
          ...msg,
          deletedBy: [...(msg.deletedBy ?? []), userId],
          content: '',
          imageUrl: null
        }
      : msg
    )
  })),

  deleteConversationRealtime: (matchId, userId) =>
    set((state) => ({
    messages: state.messages.map((msg) =>
      msg.senderId === matchId || msg.receiverId === matchId
    ? {
        ...msg,
        deletedBy: [...(msg.deletedBy ?? []), userId],
        content: '',
        imageUrl: null
      }
    : msg
    )
  })),
  
  // Optimistic/local (local)
  removeMessage: (messageId, userId) => get().deleteMessageRealtime(messageId, userId),
  
  removeConversation: (matchId, userId) => get().deleteConversationRealtime(matchId, userId),

  deleteConversationAndMatch: async (matchId: string, currentUserId: string) => {
    try {
        // 1. Llamada a la API de borrado
        const response = await fetch(`/api/chat/history/${matchId}/delete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            console.error('Error al borrar conversación en el servidor');
            // Aquí podrías agregar un toast o manejar el error
            return false;
        }

        // 2. BORRADO LOCAL: Limpiamos los mensajes del estado, en lugar de marcarlos como borrados.
        set(state => ({
            messages: state.messages.filter(msg => 
                // Mantenemos solo los mensajes que NO pertenecen a la conversación eliminada
                !(msg.senderId === matchId || msg.receiverId === matchId) 
            )
        }));

        // 3. Borrado del match de la lista: Esto resuelve el problema de que el chat reaparezca.
        set(state => ({
            matches: state.matches.filter(m => m.id !== matchId)
        }));

        // 4. Reset del chat activo si estábamos en él
        if (get().activeMatchId === matchId) {
            // set({ activeMatchId: null, messages: [] });
            set({ activeMatchId: null });
        }

        return true;

    } catch (error) {
        console.error('Error durante la solicitud de borrado:', error);
        return false;
    }
  },
  
  // ------- Gestión de estado de usuarios -------
  updateUserStatus: (id, online) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [id]: online }
  })),

  // ------- Gestión de Bloqueo/Desbloqueo (solo para el match que se ve) -------
  updateBlockStatus: (blockedId, isBlocked) => set((state) => ({
    matches: state.matches.map((match) => 
      match.id === blockedId ? { ...match, isBlockedByMe: isBlocked } : match
    ),
  
    activeMatchId: 
    isBlocked && state.activeMatchId === blockedId
    ? null
    : state.activeMatchId
  })),
 
  getUnreadCount: (matchId) => {
    const match = get().matches.find((m) => m.id === matchId);
    return match?.unreadCount ?? 0;
  },

  getTotalUnread: () => get().matches.reduce((t, m) => t + (m.unreadCount ?? 0), 0),

  setLikesSent: (userIds) => set({ likesSent: userIds }),
  setLikesReceived: (userIds) => set({ likesReceived: userIds }),
  
  resetChat: () => set({
    isExpanded: false,
    activeMatchId: null,
    messages: [],
    matches: [],
    onlineUsers: {},
    likesSent: [],
    likesReceived: [],
    isModalOpen: false, // también lo reseteamos
    
  }),
  
}));
