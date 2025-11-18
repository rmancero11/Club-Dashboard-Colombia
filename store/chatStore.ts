import { create } from 'zustand';
import { MessageStatus, MessageType, UserStatusChange } from '@/app/types/chat';

// Definimos la interfaz del estado de la tienda
interface ChatStore {
  // Estado de la UI
  isChatOpen: boolean; // Controlamos si el chat está abierto o cerrado
  // Datos
  messages: MessageType[];
  onlineUsers: { [key: string]: boolean }; // Mapeo de userId a estado (true/false)

  // Acciones (funciones para modificar el estado)
  setIsChatOpen: (isOpen: boolean) => void;
  setMessages: (msgs: MessageType[]) => void;
  addMessage: (msg: MessageType) => void;
  updateUserStatus: (id: string, online: boolean) => void;
  // Actualizamos el estado de un mensaje (logica de Optimistic UI)
  updateMessageStatus: (localId: string, newStatus: MessageStatus, prismaId?: string) => void;
  // Marcamos un mensaje como leído
  markMessageAsRead: (messageId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Estado inicial
  isChatOpen: false,
  messages: [],
  onlineUsers: {},

  // ------- Acciones basicas de estado -------
  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  setMessages: (msgs) => set({ messages: msgs }),

  // ------- Acciones de datos -------
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
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
    messages: state.messages.map(msg =>
      msg.id === messageId
      ? { ...msg, readAt: new Date().toISOString() }
      : msg
    ),
  })),

}));