import { create } from 'zustand';
import { MessageStatus, MessageType, UserStatusChange } from '@/app/types/chat';

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
}

// Definimos la interfaz del estado de la tienda
export interface ChatStore {
  // Estado de la UI
  isExpanded: boolean; // Controlamos si el modal está expandido. False si está minimizado
  activeMatchId: string | null; // ID del match que se está visiualizando (cuando se abre la ventana)
  // Datos
  messages: MessageType[];
  onlineUsers: { [key: string]: boolean }; // Mapeo de userId a estado (true/false)
  matches: MatchContact[]; // Lista de contactos con los que se puede chatear
  likesSent: string[]; // Lista de userIds que se han enviado likes
  likesReceived: string[]; // Lista de userIds que se han recibido likes
  isModalOpen: boolean;
openModal: () => void;
closeModal: () => void;

  // Acciones de UI 
  setIsExpanded: (isExpanded: boolean) => void;
  setActiveChat: (matchId: string | null) => void;

  // Acciones de datos
  setMatches: (matchList: MatchContact[]) => void;
  setLikesSent: (userIds: string[]) => void;
  setLikesReceived: (userIds: string[]) => void;
  setMessages: (msgs: MessageType[]) => void;
  addMessage: (msg: MessageType) => void;
  updateUserStatus: (id: string, online: boolean) => void;
  updateBlockStatus: (blockedId: string, isBlocked: boolean) => void;

  // Actualizamos el estado de un mensaje (logica de Optimistic UI)
  updateMessageStatus: (localId: string, newStatus: MessageStatus, prismaId?: string) => void;
  // Marcamos un mensaje como leído
  markMessageAsRead: (messageId: string) => void;
  markMessagesAsRead: (readerId: string) => void;
  prependMessages: (msgs: MessageType[]) => void;
  removeMessage: (messageId: string) => void;
  removeConversation: (matchId: string) => void;
}

const initialChatState = {
    // Estado inicial
  isExpanded: false,
  activeMatchId: null,
  messages: [],
  onlineUsers: {},
  matches: [],
  likesSent: [],
  likesReceived: [],
  
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  ...initialChatState,

  // ➕ NUEVO estado
  isModalOpen: false,

  // ➕ NUEVAS acciones
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  // ------- Acciones de UI -------
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setActiveChat: (matchId) => {
    if (matchId !== null) {
      set({ activeMatchId: matchId, isExpanded: true });
    } else {
      set({ activeMatchId: null });
    }
  },

  // ------- Acciones de datos -------
  setMatches: (matchList) => set({ matches: matchList }),
  setLikesSent: (userIds) => set({ likesSent: userIds }),
  setLikesReceived: (userIds) => set({ likesReceived: userIds }),
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  prependMessages: (msgs) => set((state) => ({ messages: [...msgs, ...state.messages] })),


  // ------- Gestión de borrado de mensajes -------
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== messageId)
  })),

  removeConversation: (matchId) => set((state) => ({
    messages: state.messages.filter(msg =>
      msg.senderId !== matchId && msg.receiverId !== matchId
    )
  })),

  // ------- Gestión de estado de usuarios -------
  updateUserStatus: (id, online) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [id]: online }
  })),

  updateMessageStatus: (localId, newStatus, prismaId) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.localId === localId
        ? { ...msg, status: newStatus, id: prismaId || msg.id }
        : msg
    )
  })),

  markMessageAsRead: (messageId) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === messageId
        ? { ...msg, readAt: new Date().toISOString() }
        : msg
    )
  })),

  markMessagesAsRead: (readerId) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.receiverId === readerId && !msg.readAt
        ? { ...msg, readAt: new Date().toISOString() }
        : msg
    )
  })),

  // ------- Gestión de Bloqueo/Desbloqueo (solo para el match que se ve) -------
  updateBlockStatus: (blockedId, isBlocked) => set((state) => ({
    matches: state.matches.map(match => 
      match.id === blockedId ? { ...match, isBlockedByMe: isBlocked } : match
    ),
    // Al bloquear, se desactiva la conversación para forzar a volver a la lista
    activeMatchId: isBlocked ? (state.activeMatchId === blockedId ? null : state.activeMatchId) : state.activeMatchId,
  })),

  resetChat: () => set({
    messages: [],
    matches: [],
    onlineUsers: {},
    activeMatchId: null,
    isExpanded: false,
    likesSent: [],
    likesReceived: [],
    isModalOpen: false, // también lo reseteamos
    
  }),
  
}));
