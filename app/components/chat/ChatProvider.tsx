'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore, MatchContact } from '@/store/chatStore';
import ChatModal from '../ChatModal'; 
import { usePathname } from 'next/navigation';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const pathname = usePathname();

  const { user, isLoading } = useAuth(); // Obtenemos el usuario autenticado
  const currentUserId = user?.id;

  // Extraemos el estado de expansión para pasarlo al hook de socket
  const isExpanded = useChatStore(state => state.isExpanded);
  const setMatches = useChatStore(state => state.setMatches);

  // ---- Conectamos al socket y pasamos el estado de expansión ----
  useSocket(currentUserId || '', isExpanded); 

  useEffect( () => {
    if (user && user.id) {

      // Función para cargar la data inicial (lista de Matches)
      const loadInitialChatData = async () => {
        try {
          // Llamamos a la API REST (Esta API será modificada en el Objetivo 2.A)
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
      };
      loadInitialChatData();
    }

  }, [user, setMatches]);

  const BLOCKED_ROUTES = ['api/auth/login', 'api/auth/accept-register'];
  const isBlockedRoute = BLOCKED_ROUTES.includes(pathname);

  if (isLoading) {
    return <div>{children}</div>;
  }

  if (isBlockedRoute) {
    return <div>{children}</div>;
  }

  if (!currentUserId) {
    return <div>{children}</div>;
  }
  
  // Renderizamos el layout y el ChatModal
  return (
    <>
      {children}
      
      {/* El ChatModal Flotante, visible si hay usuario */}
      <ChatModal currentUserId={currentUserId} /> 
    </>
  );
};