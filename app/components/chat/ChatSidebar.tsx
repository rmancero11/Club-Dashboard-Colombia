"use client";

import React, { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { Heart, ChevronUp, ChevronDown } from "lucide-react";

interface ChatSidebarProps {
  currentUserId: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ currentUserId }) => {
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const matches = useChatStore((state) => state.matches);
  const likesReceived = useChatStore((state) => state.likesReceived);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const messages = useChatStore(state => state.messages);

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta si es mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // SI NO HAY MATCHES NI LIKES → IGUAL mostramos la barrita en mobile
  const empty = matches.length === 0 && likesReceived.length === 0;

  // Helper: obtener el último mensaje entre currentUser y otherId
  const getLastMessageForMatch = (otherId: string) => {
    // Recorremos desde el final (mensajes más recientes)
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        (m.senderId === currentUserId && m.receiverId === otherId) ||
        (m.senderId === otherId && m.receiverId === currentUserId)
      ) {
        return m;
      }
    }
    return null;
  };

  /* -------------------------- MOBILE VERSION ------------------------------- */
  if (isMobile) {
    return (
      <>
        {/* BOTÓN/BARRA FIJA ABAJO */}
        <div
          className="
            fixed bottom-0 left-0 w-full 
            bg-white border-t border-gray-300 
            shadow-lg z-40 
            flex items-center justify-between 
            p-3
          "
          onClick={() => setOpen(!open)}
        >
          <span className="font-semibold text-lg">Matches</span>

          {/* Likes recibidos */}
          {likesReceived.length > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm flex items-center gap-1">
              <Heart className="w-4 h-4 fill-white" />
              {likesReceived.length}
            </span>
          )}

          {open ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>

        {/* PANEL DESPLEGABLE HACIA ARRIBA */}
        <div
          className={`
            fixed left-0 w-full bg-white shadow-xl z-50 
            transition-all duration-300 overflow-hidden
            ${open ? "bottom-12 h-3/5" : "bottom-0 h-0"}
          `}
        >
          <div className="p-4 overflow-y-auto h-full">
            <h3 className="text-xl font-bold mb-4">Tus Matches</h3>

            {empty && (
              <p className="text-sm text-gray-500">No hay matches aún.</p>
            )}

            {!empty &&
              matches.map((match) => {
                const lastMessage = getLastMessageForMatch(match.id);

                // Construir el texto breve (si fue borrado o foto, etc)
                let briefText = "Iniciar conversación...";
                if (match.isBlockedByMe) briefText = "Usuario bloqueado.";
                else if (lastMessage) {
                  if (Array.isArray(lastMessage.deletedBy) && lastMessage.deletedBy.length > 0) {
                    // Si el último mensaje fue borrado (por alguien), mostramos texto adecuado
                    const deletedByMe = lastMessage.deletedBy.includes(currentUserId);
                    briefText = deletedByMe ? "Eliminaste este mensaje." : "Este mensaje fue eliminado.";
                  } else if (lastMessage.content && lastMessage.content.trim().length > 0) {
                    briefText = lastMessage.content;
                  } else if (lastMessage.imageUrl) {
                    briefText = "📷 Foto";
                  }
                } else if (match.lastMessageContent) {
                  briefText = match.lastMessageContent;
                }
                return (
                  <div
                    key={match.id}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                    onClick={() => setActiveChat(match.id)}
                  >
                    <img
                      src={match.avatar}
                      alt={match.name ?? "Usuario"}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />

                    <div className="flex-grow min-w-0">
                      <span className="font-medium block truncate">
                        {match.name ||
                          `Match ID: ${match.id.substring(0, 4)}...`}
                      </span>
                      <span className="text-sm text-gray-600 block truncate">
                        {briefText}
                      </span>

                      {/* preview del último mensaje real */}
                      {/* <span className="text-sm text-gray-600 block truncate">
                        {lastMessage?.content ?? "Iniciar conversación..."}
                      </span> */}
                    </div>

                    {onlineUsers[match.id] ? (
                      <span
                        className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                        title="Online"
                      ></span>
                    ) : (
                      <span
                        className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white"
                        title="Offline"
                      ></span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </>
    );
  }

  /* -------------------------- DESKTOP VERSION ----------------------------- */
  return null;
  
};

export default ChatSidebar;
