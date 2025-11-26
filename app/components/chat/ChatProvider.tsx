'use client';

import React, { useEffect } from 'react';
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

  // Socket
  useSocket(currentUserId || '', isExpanded); 

  useEffect(() => {
    if (user && user.id) {

      const loadInitialChatData = async () => {
        try {
          const response = await fetch(`/api/chat/matches`);
          if (!response.ok) throw new Error(`Failed to fetch matches`);

          const matches: MatchContact[] = await response.json();

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
