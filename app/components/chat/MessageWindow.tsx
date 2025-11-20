'use client';

import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/app/hooks/useSocket";
import { MessageType } from "@/app/types/chat";

interface MessageWindowProps {
  currentUserId: string;
  matchId: string; // ID del usuario con el que se está chateando
  matchName: string | null;
}

const MessageWindow: React.FC<MessageWindowProps> = ({ currentUserId, matchId, matchName }) => {

  // Obtenemos la función de envío y la acción de prependMessages
  const { sendMessage } = useSocket(currentUserId);
  // const { setIsChatOpen, setMessages } = useChatStore.getState();
  const setActiveChat = useChatStore(state => state.setActiveChat);
  const setMessages = useChatStore(state => state.setMessages);

  const [inputContent, setInputContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtramos los mensajes solo para este chat activo
  const messages = useChatStore(state => 
    state.messages.filter(msg => 
    (msg.senderId === currentUserId && msg.receiverId === matchId) ||
    (msg.senderId === matchId && msg.receiverId === currentUserId)
    )
  );

  // Cargamos el historial (llamada al API)
  useEffect(() => {
    // Logica para cargar msj antiguos
    const fetchHistory = async () => {
      try {
        // Limpiamos el estado de mensajes antes de cargar un nuevo chat
        setMessages([]);

        // Llamamos a la API REST de historial
        const response = await fetch(`/api/chat/history/${matchId}`);
        if (!response.ok) throw new Error('Failed to fetch chat history');

        const history: MessageType[] = await response.json();

        // Usamos setMessages para borrar mensajes de otros chats
        setMessages(history.map(msg => ({
          ...msg,
          status: 'sent' as 'sent',
        })));
        
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
    fetchHistory();
  }, [matchId, setMessages]); // Se ejecuta cuando cambia el matchId

  // Scroll automático al ultimo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Manejamos el envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputContent.trim()) {
      sendMessage({
        receiverId: matchId,
        content: inputContent.trim()
      });
      setInputContent('');
    }
  };

  const handleClose = () => {
    setActiveChat(null);
  }

  return (
    <div className="flex flex-col h-[600px] w-96 border rounded-lg shadow-2xl bg-white">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white font-bold rounded-t-lg">
          <span>{matchName || 'Match'}</span>
          <button onClick={handleClose} className="text-white hover:text-gray-200 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Lista de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg: MessageType) => (
            <div 
              key={msg.id || msg.localId}
              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs p-3 rounded-lg text-sm shadow-md 
                ${msg.senderId === currentUserId 
                ? 'bg-blue-100 text-black' 
                : 'bg-gray-200 text-black'}`
              }>
                {msg.content}
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {msg.senderId === currentUserId && (
                    <span className="mr-1">
                      {msg.status === 'pending' ? '...' : (msg.readAt ? '✔✔' : '✔')}
                    </span>
                  )}
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

      {/* Input de Envío */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input 
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-grow border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={!inputContent.trim()}
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};
export default MessageWindow;