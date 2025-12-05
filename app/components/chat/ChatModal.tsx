'use client';

import React from 'react';
import { useChatStore } from '@/store/chatStore';
import ChatList from './ChatList';
import ConversationWindow from './ConversationWindow';

// Íconos
const MinimizeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ChatModalProps {
  currentUserId: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ currentUserId }) => {
  const isModalOpen = useChatStore(state => state.isModalOpen);
  const closeModal = useChatStore(state => state.closeModal);

  const isExpanded = useChatStore(state => state.isExpanded);
  const activeMatchId = useChatStore(state => state.activeMatchId);
  const matches = useChatStore(state => state.matches);
  const setActiveChat = useChatStore(state => state.setActiveChat);
  const setIsExpanded = useChatStore(state => state.setIsExpanded);

  if (!isModalOpen) return null;

  const activeMatch = activeMatchId ? matches.find(m => m.id === activeMatchId) : null;

  const toggleExpanded = () => {
    if (isExpanded) {
      setActiveChat(null);
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div className="
  fixed 
  left-0 right-0 top-0 
  bottom-[70px]    /* ← deja libre la barra inferior */
  bg-black bg-opacity-50 
  flex justify-center items-center 
  z-[60] 
  p-0 md:p-4 
  transition-opacity duration-300
">

      <div className="bg-white w-full h-full md:h-[500px] md:max-w-md flex flex-col shadow-xl overflow-hidden font-montserrat transition-transform duration-300">

        {/* Encabezado solo si NO hay ConversationWindow */}
        {!activeMatchId && (
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <h3 className="text-lg font-semibold text-white">
              Mensajes
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-200 hover:text-red-900 text-white transition-colors"
                title="Cerrar chat"
              >
                <CloseIcon className="w-6 h-6 text-white-600" />
              </button>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="flex-grow overflow-y-auto bg-white">
          {activeMatchId ? (
            <ConversationWindow
              currentUserId={currentUserId}
              matchId={activeMatchId}
              matchName={activeMatch?.name || 'Usuario'}
            />
          ) : (
            <ChatList currentUserId={currentUserId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
