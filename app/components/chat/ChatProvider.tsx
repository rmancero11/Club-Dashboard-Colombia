'use client';

import React, { useEffect, useCallback } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore, MatchContact } from '@/store/chatStore';
import ChatModal from './ChatModal';
import { usePathname } from 'next/navigation';
import { MessageType } from '@/app/types/chat';

const normalizeMessage = (msg: any): MessageType => ({
  id: msg.id ?? crypto.randomUUID(),
  senderId: msg.senderId ?? "",
  receiverId: msg.receiverId ?? "",
  content: msg.content ?? "",
  createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
  // updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
  imageUrl: msg.imageUrl ?? null,
  readAt: msg.readAt ?? null,
  deletedBy: msg.deletedBy ?? [],
  status: msg.status ?? "sent",
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const pathname = usePathname();

  const { user, isLoading } = useAuth();
  const currentUserId = user?.id;

  // Nuevo: traemos el estado del modal
  const isModalOpen = useChatStore(state => state.isModalOpen);

  const isExpanded = useChatStore(state => state.isExpanded);
  const setMatches = useChatStore(state => state.setMatches);
  const upsertMessages = useChatStore(state => state.upsertMessages);

  // Función para cargar la data inicial (lista de Matches)
  const loadInitialChatData = useCallback(async () => {
    if (!user || !user?.id) return;

    try {
      // Llamamos a la API REST
      const response = await fetch(`/api/chat/matches`);

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.statusText}`);
      }

      const matches: MatchContact[] = await response.json();

      // Establcemos la lista de matches en Zustand
      setMatches(matches);      

      // -------------------------------
      //  📌  Insertamos SOLO previews
      // -------------------------------
      const previewMessages = matches
        .filter(m => m.lastMessageContent)
        .map(m =>
        normalizeMessage({
          id: `preview-${m.id}`,
          senderId: m.lastMessageContent?.startsWith("Tú:") ? currentUserId! : m.id,
          receiverId: m.lastMessageContent?.startsWith("Tú:") ? m.id : currentUserId!,
          content: m.lastMessageContent?.replace("Tú: ", ""),
          createdAt: m.lastMessageAt,
          updatedAt: m.lastMessageAt,
        })
      );

      // Upsert SOLO previews → sin mezclar mensajes reales
      if (previewMessages.length > 0) {
        upsertMessages(previewMessages);
      }

    } catch (error) {
      console.error('Error loading initial chat data:', error);
    }
  }, [user, setMatches, upsertMessages, currentUserId]);// Dependencias: user (para verificar ID) y setMatches

  // ---- Conectamos al socket, pasamos el estado de expansión y la función de recarga ----
  // El hook useSocket ahora devolverá las funciones del socket.
  // Por lo tanto, no necesitamos guardar el retorno.
  useSocket(currentUserId || '', isExpanded, loadInitialChatData);
  
  // Efecto inicial para la PRIMERA carga de datos
  useEffect( () => {
    // Si hay usuario, cargamos la data.
    if (user && user?.id) {
      loadInitialChatData();
    }
  }, [user, loadInitialChatData]);

  const BLOCKED_ROUTES = ['api/auth/login', 'api/auth/accept-register'];
  const isBlockedRoute = BLOCKED_ROUTES.includes(pathname);

  if (isLoading || isBlockedRoute || !currentUserId) return <>{children}</>;

  return (
    <>
      {children}

      {/* Nuevo: solo mostrar SI isModalOpen === true */}
      {isModalOpen && (
        <ChatModal currentUserId={currentUserId} />
      )}
    </>
  );
};
