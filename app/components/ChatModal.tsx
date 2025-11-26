'use client';

import React from 'react';
import { useChatStore } from '@/store/chatStore';
import ChatList from './ChatList';
import ConversationWindow from './chat/ConversationWindow';

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

  if (!isModalOpen) return null; // No mostrar nada si está cerrado

  // Match activo
  const activeMatch = activeMatchId ? matches.find(m => m.id === activeMatchId) : null;

  // Toggle expandido / minimizado dentro del modal
  const toggleExpanded = () => {
    if (isExpanded) {
      setActiveChat(null);
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md h-[500px] flex flex-col rounded-lg shadow-xl overflow-hidden">
        {/* Encabezado */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {activeMatchId ? activeMatch?.name || 'Chat' : 'Mensajes'}
          </h3>
          <div className="flex items-center space-x-2">
            {activeMatchId && (
              <button
                onClick={() => setActiveChat(null)}
                className="p-1 rounded-full hover:bg-gray-200"
                title="Volver a la lista"
              >
                <MinimizeIcon className="w-5 h-5" style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            <button
              onClick={closeModal}
              className="p-1 rounded-full hover:bg-red-200"
              title="Cerrar chat"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido: Lista de chats o conversación */}
        <div className="flex-grow overflow-y-auto">
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
