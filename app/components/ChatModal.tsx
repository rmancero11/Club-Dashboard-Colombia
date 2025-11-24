'use client';

import React from 'react';
import { useChatStore } from '@/store/chatStore';
import ChatList from './ChatList'; 
import ConversationWindow from './chat/ConversationWindow';

// Íconos necesarios
const ChatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const MinimizeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

interface ChatModalProps {
  currentUserId: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ currentUserId }) => {
  // const { isExpanded, activeMatchId, matches } = useChatStore(state => ({
  //   isExpanded: state.isExpanded,
  //   activeMatchId: state.activeMatchId,
  //   // setIsExpanded: state.setIsExpanded,
  //   matches: state.matches,
  // }));
  const isExpanded = useChatStore(state => state.isExpanded);
  const activeMatchId = useChatStore(state => state.activeMatchId);
  const matches = useChatStore(state => state.matches);
  const setIsExpanded = useChatStore(state => state.setIsExpanded);
  const setActiveChat = useChatStore(state => state.setActiveChat);

  // Buscar el nombre del match activo para el encabezado
  const activeMatch = activeMatchId 
    ? matches.find(m => m.id === activeMatchId)
    : null;

  // Lógica de Retraer/Expandir
  const toggleExpanded = () => {
    // Si se hace click y está expandido, se minimiza.
    // Si se minimiza, volvemos a la lista de chats
    if (isExpanded) {
        setActiveChat(null); // Asegura que regrese a la vista de lista antes de minimizar
        setIsExpanded(false);
    } else {
        // Si está minimizado, se expande a la vista de lista
        setIsExpanded(true);
    }
  };

  const baseClasses = "fixed bottom-4 right-4 z-50 rounded-lg shadow-xl transition-all duration-300 overflow-hidden bg-green-200 border border-gray-300";
  
  // Estado: Contraído (Minimizado)
  if (!isExpanded) {
    return (
      <button 
        className={`${baseClasses} w-16 h-12 flex items-center justify-center bg-blue-600 text-back hover:bg-blue-700 hover:text-white`}
        onClick={toggleExpanded}
        title="Abrir Chats"
      >
        <ChatIcon className="w-6 h-6" />
        {/* Placeholder para contador de mensajes no leídos */}
      </button>
    );
  }
  
  // Estado: Expandido (Lista de Chats o Conversación)
  const expandedClasses = "w-[350px] h-[500px] flex flex-col";
  
  return (
    <div className={`${baseClasses} ${expandedClasses}`}>
      
      {/* Encabezado Común para el estado Expandido */}
      <div className="p-4 border-b flex justify-between items-center bg-green-400 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {/* Si hay un chat activo, muestra el nombre. Sino, muestra 'Mensajes' */}
            {activeMatchId ? activeMatch?.name || 'Chat' : 'Mensajes'}
          </h3>
          <div className='flex items-center space-x-2'>
            {/* Botón para volver a la Lista de Chats desde la Conversación */}
            {activeMatchId && (
                <button 
                    onClick={() => setActiveChat(null)} // Vuelve a la lista (activeMatchId: null)
                    className='p-1 rounded-full hover:bg-green-600 text-white'
                    title="Volver a la lista"
                >
                    {/* Flecha hacia la izquierda */}
                    <MinimizeIcon style={{ transform: 'rotate(180deg)' }} className='w-5 h-5'/>
                </button>
            )}
            {/* Botón para Minimizar o Cerrar */}
            <button 
                onClick={toggleExpanded}
                className='p-1 rounded-lg hover:bg-red-300 text-back'
                title="Minimizar"
            >
                <CloseIcon className='w-5 h-5'/>
            </button>
          </div>
      </div>
      
      {/* Contenido Condicional */}
      {activeMatchId ? (
        // Estado: Conversación Activa
        <ConversationWindow 
            currentUserId={currentUserId} 
            matchId={activeMatchId}
            matchName={activeMatch?.name || 'Usuario'}
            // Los campos de info (country, birthday, gender, online) serán cargados 
            // y usados directamente dentro de ConversationWindow 
        />
      ) : (
        // Estado: Lista de Chats
        <ChatList currentUserId={currentUserId} />
      )}
      
    </div>
  );
};

export default ChatModal;