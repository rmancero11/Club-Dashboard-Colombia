import React, { useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageType } from '../../types/chat';
import { useCountdown } from '../../hooks/useCountdown';
import ChatMessagesPreloader from './ChatMessagesPreloader';

// Icono de búsqueda
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

// Icono de bloqueo
const BlockSmallIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><title>Usuario Bloqueado</title><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
);

interface ChatListProps {
  currentUserId: string;
}

const formatLastMessageTime = (date: Date | string | null): string => {
  if (!date) return '';
  const lastMsgDate = new Date(date);
  const now = new Date();
  if (lastMsgDate.toDateString() === now.toDateString()) {
    return lastMsgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (lastMsgDate.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  return lastMsgDate.toLocaleDateString();
}

const ChatList: React.FC<ChatListProps> = ({ currentUserId }) => {
  const onlineUsers = useChatStore(state => state.onlineUsers);
  const matches = useChatStore(state => state.matches);
  const setActiveChat = useChatStore(state => state.setActiveChat);
  const activeMatchId = useChatStore(state => state.activeMatchId);
  const allMessages = useChatStore(state => state.messages);
  const deleteConversationAndMatch = useChatStore(state => state.deleteConversationAndMatch);
  const getUnreadCount = useChatStore(state => state.getUnreadCount);

  const isLoadingMatches = useChatStore(state => state.isLoadingMatches);
  const countdown = useCountdown(10);

  const [searchTerm, setSearchTerm] = React.useState('');

  const lastMessageByMatch = useMemo(() => {
    const map: Record<string, MessageType | undefined> = {};
    for (const m of allMessages) {
      const otherId = m.senderId === currentUserId ? m.receiverId : m.senderId;
      if (!otherId) continue;
      const existing = map[otherId];
      if (!existing || new Date(m.createdAt) > new Date(existing.createdAt)) {
        map[otherId] = m;
      }
    }
    return map;
  }, [allMessages, currentUserId]);

  const displayedMatches = matches.filter(match => 
    match.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // if (matches.length === 0) {
  //   return (
  //     <div className="flex-grow flex items-center justify-center p-4 font-montserrat">
  //       <p className="text-sm text-gray-500">No hay chats activos.</p>
  //     </div>
  //   );
  // }

  // 1. ESTADO DE CARGA (Alta prioridad)
  if (isLoadingMatches) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4 font-montserrat bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
        <p className="text-sm text-purple-600 font-semibold">
          Cargando historial de chats...
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Tiempo estimado: {countdown} segundos.
        </p>
      </div>
    );
  }

  // 2. ESTADO SIN CHATS (Cuando la carga terminó y la lista está vacía)
  if (!isLoadingMatches && matches.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4 font-montserrat text-center">
        <span className="text-4xl mb-3" role="img" aria-label="Sin chats">💬</span>
        <p className="text-base font-semibold text-gray-700 mb-1">
          ¡Aún no hay conversaciones!
        </p>
        <p className="text-sm text-gray-500 px-4">
          Empieza a hacer match con otros usuarios para que tus chats aparezcan aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-montserrat">
      {/* Barra de búsqueda */}
      <div className="p-3 border-b flex-shrink-0 bg-purple-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-grow overflow-y-auto bg-white">
        
        {displayedMatches.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No se encontraron resultados.
          </div>
        )}
        {displayedMatches.map(match => {
          const lastMsg = lastMessageByMatch[match.id];
          const unread = getUnreadCount(match.id);
          const lastAt = lastMsg?.createdAt ?? match.lastMessageAt;

          let briefText = "💬 Iniciar conversación...";

          // let briefText = '😴 ¡Despiertame, abre la conversación!';
          if (match.isBlockedByMe){ 
            briefText = 'Usuario bloqueado.'
          }
          else if (lastMsg) {
            const wasDeleted = Array.isArray(lastMsg.deletedBy) && lastMsg.deletedBy.length > 0;
            const deletedForMe = lastMsg.deletedBy?.includes(currentUserId);
            
            if (wasDeleted) {
              briefText = deletedForMe ? "Eliminaste este mensaje" : "Este mensaje fue eliminado";
            } else if (lastMsg.imageUrl) {
              briefText = "📷 Foto";
            } else if (lastMsg.content && lastMsg.content.trim().length > 0) {
              briefText = lastMsg.content;
            }
          }
          else if (match.lastMessageContent) {
            briefText = match.lastMessageContent;
          }

          // if (lastMsg) {
          //   const wasDeleted =
          //     Array.isArray(lastMsg.deletedBy) && lastMsg.deletedBy.length > 0;
          //   const deletedForMe = lastMsg.deletedBy?.includes(currentUserId);
          //   const deletedByOther = wasDeleted && !deletedForMe;

          //   // Caso 1: Mensaje eliminado → siempre mostrar texto especial
          //   if (wasDeleted) {
          //     briefText = deletedForMe
          //       ? "Eliminaste este mensaje"
          //       : "Este mensaje fue eliminado";
          //   }
          //   // Caso 2: Tiene contenido válido → usarlo
          //   else if (lastMsg.content && lastMsg.content.trim().length > 0) {
          //     briefText = lastMsg.content;
          //   }
          //   // Caso 3: Es una imagen
          //   else if (lastMsg.imageUrl) {
          //     briefText = "📷 Foto";
          //   }
          //   // ❗ Caso 4: Mensaje está vacío y NO está eliminado → IGNORARLO
          //   else {
          //     // Si el match ya tenía contenido previo, usarlo
          //     if (match.lastMessageContent) {
          //       briefText = match.lastMessageContent;
          //     } else {
          //       briefText = "💬 Iniciar conversación...";
          //     }
          //   }
          
          // }
          // const lastAt = lastMsg?.createdAt ?? match.lastMessageAt;
          // const unread = getUnreadCount(match.id);

          return (
            <div
              key={match.id}
              className={`flex items-center p-3 border-b hover:bg-purple-100 cursor-pointer transition-colors ${
                match.id === activeMatchId ? 'bg-purple-100 border-l-4 border-purple-600' : ''
              }`}
              onClick={() => setActiveChat(match.id)}
            >
              <div className="relative mr-3 flex-shrink-0">
                <img
                  src={match.avatar}
                  alt={match.name || 'Usuario'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {onlineUsers[match.id] && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-semibold block truncate text-sm text-purple-700">
                    {match.name || 'Usuario'}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatLastMessageTime(lastAt)}
                  </span>
                </div>
                <p className={`text-sm truncate ${match.isBlockedByMe ? 'text-red-500 italic' : 'text-gray-700'}`}>
                  {briefText}
                </p>
              </div>

              {unread > 0 && (
                <div
                  className="ml-3 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full"
                  title={`${unread} mensajes no leídos`}
                >
                  {unread}
                </div>
              )}

              {match.isBlockedByMe && (
                <div className="ml-2">
                  <BlockSmallIcon />
                </div>
              )}

              <div
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('¿Estás seguro de que quieres eliminar toda la conversación? Esto no se puede deshacer.')) {
                    const success = await deleteConversationAndMatch(match.id, currentUserId);
                    
                  }else {
                      alert('Error al borrar conversación. Intentalo de nuevo.');
                    }
                }}
                className="ml-2 px-2 py-1 text-gray-500 hover:text-red-500 rounded cursor-pointer"
                title="Borrar conversación"
              >
                🗑️
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
