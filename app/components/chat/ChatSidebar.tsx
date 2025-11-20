import React from 'react';
import { useChatStore } from '@/store/chatStore';

interface ChatSidebarProps {
  currentUserId: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ currentUserId }) => {
  // Obtenemos la lista de matches y el estado online
  const { onlineUsers, matches } = useChatStore(state => ({
    onlineUsers: state.onlineUsers,
    matches: state.matches,
  }));
  
  const setActiveChat = useChatStore(state => state.setActiveChat);

  // Verificamos si hay matches para mostrar
  if (matches.length === 0) {
    return (
      <aside className="fixed right-0 top-0 h-full w-64 bg-gray-100 p-4 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Matches</h3>
        <p className="text-sm text-gray-500">No hay matches activos.</p>
      </aside>
    );
  }

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-gray-100 p-4 shadow-lg overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">Mis Chats ({matches.length})</h3>
      <hr className="mb-4" />
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