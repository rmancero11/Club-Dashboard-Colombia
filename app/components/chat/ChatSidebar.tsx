import React from 'react';
import { useChatStore } from '@/store/chatStore';
import { Heart } from 'lucide-react';

interface ChatSidebarProps {
  currentUserId: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ currentUserId }) => {

  const onlineUsers = useChatStore(state => state.onlineUsers);
  const matches = useChatStore(state => state.matches);
  const likesReceived = useChatStore(state => state.likesReceived);
  
  const setActiveChat = useChatStore(state => state.setActiveChat);

  // No se muestra si no hay chats activos y no hay likes pendientes
  if (matches.length === 0 && likesReceived.length === 0) {
    return (
      <aside className="fixed right-0 top-0 h-full w-64 bg-gray-100 p-4 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Matches</h3>
        <p className="text-sm text-gray-500">No hay matches ni likes pendientes.</p>
      </aside>
    );
  }

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-gray-100 p-4 shadow-lg overflow-y-auto">
      {/* TÍTULO CON INDICADOR DE LIKES PENDIENTES */}
      <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
      <span className="flex items-center">
        Mis Chats ({matches.length})
      </span>
        {/* Badge de Likes Recibidos */}
        {likesReceived.length > 0 && (
          <span 
          className="ml-2 px-3 py-1 text-sm font-semibold bg-red-500 text-white rounded-full flex items-center"
          title={`Tienes ${likesReceived.length} likes pendientes`}
          >
            <Heart className="w-4 h-4 mr-1 fill-white" />
            {likesReceived.length}
          </span>
        )}
      </h3>
      <hr className="mb-4" />

      {/* Lista de Matches Activos */}
      <div className="space-y-3">
        {matches.map(match => (
          <div 
            key={match.id} 
            className="flex items-center p-2 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
            onClick={() => setActiveChat(match.id)} // Abrir el chat al hacer clic
          >
            {/* Avatar */}
            <img 
              src={match.avatar} 
              alt={match.name || 'Usuario'} 
              className="w-10 h-10 rounded-full mr-3 object-cover" 
            />
            <div className="flex-grow">
              <span className="font-medium block truncate">
                {match.name || `Match ID: ${match.id.substring(0, 4)}...`}
              </span>
            </div>
            {/* Estado Online */}
            {onlineUsers[match.id] ? (
              <span className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" title="Online"></span>
            ) : (
              <span className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white" title="Offline"></span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};
export default ChatSidebar;