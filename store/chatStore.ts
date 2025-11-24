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
  // Actualizamos el estado de un mensaje (logica de Optimistic UI)
  updateMessageStatus: (localId: string, newStatus: MessageStatus, prismaId?: string) => void;
  // Marcamos un mensaje como leído
  markMessageAsRead: (messageId: string) => void;
  markMessagesAsRead: (readerId: string) => void;
  prependMessages: (msgs: MessageType[]) => void;
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
 ... initialChatState,

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
  prependMessages: (msgs) => set((state) => ({ messages: [...msgs, ...state.messages ]})),

  // ------- Gestión de estado de usuarios -------
  updateUserStatus: (id, online) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [id]: online,
    }
  })),

  // ------- Gestión de estado de mensajes (Optimistic UI) -------
  updateMessageStatus: (localId, newStatus, prismaId) => set((state) => ({
    messages: state.messages.map(msg => {
      if (msg.localId === localId) {
        return {
          ...msg,
          status: newStatus,
          // reemplazamos el ID temporal con el ID real de Prisma al pasar a 'sent'
          id: prismaId || msg.id
        };
      }
      return msg;
    }),
  })),

  // ------- Gestión de Lectura de Mensajes -------
  markMessageAsRead: (messageId) => set((state) => ({
    messages: state.messages.map(msg =>{
      if (msg.id === messageId) {
        return {
          ...msg,
          readAt: new Date().toISOString()
        };
      }
      return msg;
    })
  })),

  markMessagesAsRead: (readerId) => set((state) => ({
    messages: state.messages.map(msg => {
      if (msg.receiverId === readerId && !msg.readAt) {
        return {
          ...msg,
          readAt: new Date().toISOString()
        };
      }
      return msg;
    })
  })),

  resetChat: () => set({
    messages: [],
    matches: [],
    onlineUsers: {},
    activeMatchId: null,
    isExpanded: false,
    likesSent: [],
    likesReceived: [],
    
  }),
  
}));