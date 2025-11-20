'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';
import ChatSidebar from './ChatSidebar';
import MessageWindow from './MessageWindow';
import { AuthUser } from '@/app/hooks/useAuth';

// Definimos el MatchContact para usar el tipo de la store
interface MatchContact {
  id: string;
  name: string | null;
  avatar: string;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const { user, isLoading } = useAuth(); // Obtenemos el usuario autenticado
  const currentUserId = user?.id;

  // Extraemos el estado de la UI
  const { activeMatchId } = useChatStore(state => ({
    isChatOpen: state.activeMatchId !== null,
    activeMatchId: state.activeMatchId,
  }));

  const setMatches = useChatStore(state => state.setMatches);

  // ---- Conectamos al socket ----
  useSocket(currentUserId || '');

  useEffect( () => {
    if (user && user.id) {

      // Función para cargar la data inicial (lista de Matches)
      const loadInitialChatData = async () => {
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
      };
      loadInitialChatData();
    }

  }, [user, setMatches]);

  if (isLoading) {
    return <div>{children}</div>;
  }

  if (!currentUserId) {
    return <div>{children}</div>;
  }

  // Renderizamos el loyout y los componentes del chat si el usuario esta conectado
  return (
    <>
      {children}
      
      {/* El Sidebar de chat siempre visible si hay usuario */}
      <ChatSidebar currentUserId={currentUserId} /> 
      
      {/* Ventana de Chat Flotante */}
      {activeMatchId && 
        <div className="fixed bottom-4 right-8 z-50">
          <MessageWindow 
            currentUserId={currentUserId}
            matchId={activeMatchId}
            // Obtener el nombre del match usando getState() para evitar re-render innecesario del Provider
            matchName={useChatStore.getState().matches.find(m => m.id === activeMatchId)?.name || 'Match'}
          />
        </div>
      }
    </>
  );
};