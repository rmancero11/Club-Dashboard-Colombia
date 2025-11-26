'use client';

import React, { useEffect, useCallback } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore, MatchContact } from '@/store/chatStore';
import ChatModal from '../ChatModal';
import { usePathname } from 'next/navigation';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const pathname = usePathname();

  const { user, isLoading } = useAuth();
  const currentUserId = user?.id;

  // Nuevo: traemos el estado del modal
  const isModalOpen = useChatStore(state => state.isModalOpen);

  const isExpanded = useChatStore(state => state.isExpanded);
  const setMatches = useChatStore(state => state.setMatches);

  // Función para cargar la data inicial (lista de Matches)
  const loadInitialChatData = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      // Llamamos a la API REST
      const response = await fetch(`/api/chat/matches`);

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.statusText}`);
      }

      const matches: MatchContact[] = await response.json();

      // Establcemos la lista de matches en Zustand
      setMatches(matches);      

    } catch (error) {
      console.error('Error loading initial chat data:', error);
    }
  }, [user, setMatches]); // Dependencias: user (para verificar ID) y setMatches

  // ---- Conectamos al socket, pasamos el estado de expansión y la función de recarga ----
  // El hook useSocket ahora devolverá las funciones del socket.
  // Por lo tanto, no necesitamos guardar el retorno.
  useSocket(currentUserId || '', isExpanded, loadInitialChatData);
  
  // Efecto inicial para la PRIMERA carga de datos
  useEffect( () => {
    // Si hay usuario, cargamos la data.
    if (user && user.id) {
      loadInitialChatData();
    }
  }, [user, loadInitialChatData]);

  const BLOCKED_ROUTES = ['api/auth/login', 'api/auth/accept-register'];
  const isBlockedRoute = BLOCKED_ROUTES.includes(pathname);

  if (isLoading) return <>{children}</>;
  if (isBlockedRoute) return <>{children}</>;
  if (!currentUserId) return <>{children}</>;

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
