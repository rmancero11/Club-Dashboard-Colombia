'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';
import ChatSidebar from './ChatSidebar';
import MessageWindow from './MessageWindow';

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
  const activeMatchId = useChatStore(state => state.activeMatchId);

  const setMatches = useChatStore(state => state.setMatches);
  const setLikesSent = useChatStore(state => state.setLikesSent);
  const setLikesReceived = useChatStore(state => state.setLikesReceived);
  // const { setMatches, setLikesSent, setLikesReceived } = useChatStore(state => ({
  //   setMatches: state.setMatches,
  //   setLikesSent: state.setLikesSent,
  //   setLikesReceived: state.setLikesReceived,
  // }));

  const loadAttempted = useRef(false);

  // ---- Conectamos al socket ----
  useSocket(currentUserId || '');

  useEffect( () => {
    if (user && user.id && !loadAttempted.current) {
      loadAttempted.current = true;
      // Función para cargar la data inicial (lista de Matches y likes)
      const loadInitialChatData = async () => {
        try {
          // --------- Obtenemos estados de likes y matches (IDs) ---------
          const statusResponse = await fetch(`/api/match/status`);
          if (!statusResponse.ok) {
            console.error('Failed to fetch match status:', statusResponse.statusText);
            // Continuamos aunque esto falle, priorizando la lista de matches
          } else {
            const { likesReceived, likesSent } = await statusResponse.json();
            // Establecemos las listas de IDs en Zustand
            setLikesReceived(likesReceived);
            setLikesSent(likesSent);
          }
          // --------- Obtenemos la lista de matches ----------
          // Llamamos a la API REST
          const matchesResponse = await fetch(`/api/chat/matches`);
    
          if (!matchesResponse.ok) {
            throw new Error(`Failed to fetch matches: ${matchesResponse.statusText}`);
          }
    
          const matches: MatchContact[] = await matchesResponse.json();
    
          // Establcemos la lista de matches ACEPTADOS en Zustand
          setMatches(matches);
    
        } catch (error) {
          console.error('Error loading initial chat data:', error);
        }
      };
      loadInitialChatData();
    }

  }, [user, setMatches, setLikesSent, setLikesReceived]);

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