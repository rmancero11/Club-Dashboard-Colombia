import React, { useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageType } from '../types/chat';

// Icono para la lista de chats
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

// Icono de Bloqueo para la lista
const BlockSmallIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
);

interface ChatListProps {
  currentUserId: string;
}

// Función auxiliar para formatear la hora (ej: "10:30 AM" o "Ayer")
const formatLastMessageTime = (date: Date | string | null): string => {
  if (!date) return '';
  const lastMsgDate = new Date(date);
  const now = new Date();
  
  // Si es hoy, muestra la hora
  if (lastMsgDate.toDateString() === now.toDateString()) {
      return lastMsgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Si fue ayer
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (lastMsgDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
  }

  // Si fue hace más de un día, muestra la fecha
  return lastMsgDate.toLocaleDateString();
}

// Componente que muestra la lista de chats
const ChatList: React.FC<ChatListProps> = ({ currentUserId }) => {

  const onlineUsers = useChatStore(state => state.onlineUsers);
  const matches = useChatStore(state => state.matches);
  const setActiveChat = useChatStore(state => state.setActiveChat);
  const activeMatchId = useChatStore(state => state.activeMatchId);

  // Mensajes de la store (los usamos para calcular el último mensaje real)
  const allMessages = useChatStore(state => state.messages);
  const getUnreadCount = useChatStore(state => state.getUnreadCount);
  
  // Lógica de búsqueda 
  const [searchTerm, setSearchTerm] = React.useState('');

  // --- Mapa de último mensaje por matchId ---
  const lastMessageByMatch = useMemo(() => {
    const map: Record<string, MessageType | undefined> = {};
    // Recorremos todos los mensajes y guardamos el último por "other user"
    for (const m of allMessages) {
      // determinamos con quién está la conversación (el "otro" participante)
      const otherId = m.senderId === currentUserId ? m.receiverId : m.senderId;
      // solo consideramos conversaciones entre usuarios (evitamos nulos)
      if (!otherId) continue;
      const existing = map[otherId];
      if (!existing || new Date(m.createdAt) > new Date(existing.createdAt)) {
        map[otherId] = m;
      }
    }
    return map;
  }, [allMessages, currentUserId]);

  // Filtramos la lista de matches por nombre
  const displayedMatches = matches.filter(match => 
    match.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // La lista "matches" ya viene ordenada desde la API
  if (matches.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">No hay chats activos.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      {/* Barra de Búsqueda */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {/* Lista de Chats */}
      <div className="flex-grow overflow-y-auto">
        {displayedMatches.length === 0 && (
             <div className="p-4 text-center text-gray-500 text-sm">No se encontraron resultados.</div>
        )}
        {displayedMatches.map(match => {
          // obtenemos el último mensaje real desde el mapa
          const lastMsg = lastMessageByMatch[match.id];

          // calculamos el texto a mostrar en la lista:
          let briefText = 'Iniciar conversación...';
          if (match.isBlockedByMe) {
            briefText = 'Usuario bloqueado.';
          } else if (lastMsg) {
            // si tiene texto, mostrarlo; si no y tiene imagen, mostrar Emoji
            if (lastMsg.content && lastMsg.content.trim().length > 0) {
              briefText = lastMsg.content;
            } else if (lastMsg.imageUrl) {
              briefText = '📷 Foto';
            } else {
              briefText = 'Iniciar conversación...';
            }
          } else if (match.lastMessageContent) {
            // fallback a la propiedad del match si existe
            briefText = match.lastMessageContent;
          }

          // hora: priorizamos la del lastMsg; si no, fallback a match.lastMessageAt
          const lastAt = lastMsg?.createdAt ?? match.lastMessageAt;
          const unread = getUnreadCount(match.id);

          return (
          <div 
            key={match.id} 
            className={`flex items-center p-3 border-b hover:bg-gray-100 cursor-pointer transition-colors ${
              match.id === activeMatchId 
              ? 'bg-blue-50 border-l-4 border-blue-600'
              : ''
            }`}
            onClick={() => setActiveChat(match.id)} // Abre el chat
          >
            {/* 3. Foto de perfil, nombre, estado, hora y breve mensaje */}
            <div className="relative mr-3 flex-shrink-0">
              <img 
                src={match.avatar} 
                alt={match.name || 'Usuario'} 
                className="w-10 h-10 rounded-full object-cover" 
              />
              {/* Estado Online */}
              {onlineUsers[match.id] && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <span className="font-semibold block truncate text-sm">
                      {match.name || `Usuario`}
                    </span>
                    {/* Hora del último mensaje  */}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatLastMessageTime(lastAt)}
                    </span>
                </div>
                {/* Breve parte del mensaje */}
                <p className={`text-sm truncate ${match.isBlockedByMe ? 'text-red-500 italic' : 'text-gray-700'}`}>
                    {briefText}
                </p>
            </div>

            {/* 🔵 Badge de mensajes no leídos */}
            {unread > 0 && (
              <div className="ml-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full"
              title={`${unread} mensajes no leídos`}
              >
                {unread}
              </div>
            )}

            {/* pequeño icono si está bloqueado */}
            {match.isBlockedByMe && (
              <div className="ml-2">
                <BlockSmallIcon />
              </div>
            )}

            {/* Botón borrar conversación: agregar aquí si querés */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('¿Borrar toda la conversación?')) {
                  useChatStore.getState().removeConversation(match.id);
                }
              }}
              className="ml-2 px-2 py-1 text-gray-500 hover:text-red-500 rounded cursor-pointer"
            >
              🗑️
            </div>

          </div>
          );
        })}
      </div>
    </div>
  );
// return (
//     <div className="flex flex-col h-full">
//       {/* Barra de Búsqueda */}
//       <div className="p-3 border-b flex-shrink-0">
//         <div className="relative">
//           <input
//             type="text"
//             placeholder="Buscar por nombre..."
//             className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//         </div>
//       </div>
      
//       {/* Lista de Chats */}
//       <div className="flex-grow overflow-y-auto">
//         {displayedMatches.length === 0 && (
//              <div className="p-4 text-center text-gray-500 text-sm">No se encontraron resultados.</div>
//         )}
//         {displayedMatches.map(match => (
//           <div 
//             key={match.id} 
//             className={`flex items-center p-3 border-b hover:bg-gray-100 cursor-pointer transition-colors ${
//               match.id === activeMatchId 
//               ? 'bg-blue-50 border-l-4 border-blue-600' // Resaltado azul para el chat activo
//               : ''
//             }`}
//             onClick={() => setActiveChat(match.id)} // Abre el chat
//           >
//             {/* 3. Foto de perfil, nombre, estado, hora y breve mensaje */}
//             <div className="relative mr-3 flex-shrink-0">
//               <img 
//                 src={match.avatar} 
//                 alt={match.name || 'Usuario'} 
//                 className="w-10 h-10 rounded-full object-cover" 
//               />
//               {/* Estado Online */}
//               {onlineUsers[match.id] && (
//                 <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
//               )}
//             </div>
            
//             <div className="flex-grow min-w-0">
//                 <div className="flex justify-between items-center">
//                     <span className="font-semibold block truncate text-sm">
//                       {match.name || `Usuario`}
//                     </span>
//                     {/* Hora del último mensaje  */}
//                     <span className="text-xs text-gray-400 flex-shrink-0">
//                         {formatLastMessageTime(match.lastMessageAt)}
//                     </span>
//                 </div>
//                 {/* Breve parte del mensaje */}
//                 <p className={`text-sm truncate ${match.isBlockedByMe ? 'text-red-500 italic' : 'text-gray-700'}`}>
//                   {match.isBlockedByMe 
//                   ? 'Usuario bloqueado.'
//                   : match.lastMessageContent
//                   ? match.lastMessageContent.trim().length > 0
//                   ? match.lastMessageContent
//                   : '📷 Foto'
//                   : 'Iniciar conversación...'}
//                 </p>
//             </div>
//             <div
//               onClick={(e) => {
//                 e.stopPropagation();
//                 if (window.confirm("¿Borrar toda la conversación?")) {
//                   useChatStore.getState().removeConversation(match.id);
//                 }
//               }}
//               className="ml-2 px-2 py-1 text-gray-500 hover:text-red-500 rounded cursor-pointer"
//               title="Borrar conversación"
//             >
//              🗑️
//             </div>
             
//           </div>
//         ))}
//       </div>
//     </div>
//   );
};

export default ChatList;