'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendMessage } from "@/app/hooks/useSocket";
import { MessageType } from "@/app/types/chat";
import { X, CornerDownLeft, Ban } from "lucide-react"; // Icono de bloqueo

interface MessageWindowProps {
  currentUserId: string;
  matchId: string; // ID del usuario con el que se está chateando
  matchName: string | null;
}

const MessageWindow: React.FC<MessageWindowProps> = ({ currentUserId, matchId, matchName }) => {

  const setActiveChat = useChatStore(state => state.setActiveChat);
  const setMessages = useChatStore(state => state.setMessages);

  const [inputContent, setInputContent] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obtenemos la lista completa de mensajes
  const allMessages = useChatStore(state => state.messages);

  // Filtramos y memorizamos la lista para este chat
  const messages = useMemo(() => {
    return allMessages.filter(msg => 
      (msg.senderId === currentUserId && msg.receiverId === matchId) ||
      (msg.senderId === matchId && msg.receiverId === currentUserId)
    );
  }, [allMessages, currentUserId, matchId]); // Solo se actualiza cuando cambia alguna de las dependencias

  // Cargamos el historial (llamada al API)
  useEffect(() => {
    // Logica para cargar msj antiguos
    const loadMessages = async () => {
      setIsHistoryLoading(true);
      try {
        // // Limpiamos el estado de mensajes antes de cargar un nuevo chat
        // setMessages([]);

        // Llamamos a la API REST de historial
        const response = await fetch(`/api/chat/history/${matchId}`);
        if (response.ok) {
          const history: MessageType[] = await response.json();

          setMessages(history); // Sobreescribimos el estado con el historial
          
        }else {
          console.error("Error fetching chat history:", response.statusText);
        }
      } catch (error) {
        console.error('Network error loading history:', error);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    // Limpiamos los mensajes al cambiar de match (para no ver msgs anteriores)
    setMessages([]);
    loadMessages();

    // Scroll al final al cargar
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
    
  }, [matchId, setMessages]); // Se ejecuta cuando cambia el matchId

  // Scroll automático al ultimo mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Manejamos el envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputContent.trim()) {
      sendMessage({
        senderId: currentUserId,
        receiverId: matchId,
        content: inputContent.trim()
      });
      setInputContent('');
    }
  };

  // Manejamos el bloqueo
  const handleBlockUser = async () => {
    if (!confirm(`¿Estás seguro de que quieres bloquear a ${matchName || 'a este usuario'}? Esto eliminará el Match.`)) {
      return;
    };

    try {
      const response = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: matchId }),
      });
      if (response.ok) {
        alert(`Has bloqueado a ${matchName}. El chat a sido cerrado.`);
        setActiveChat(null);
      } else {
        alert("Error al intentar bloquear al usuario.");
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert("Error de red al bloquear al usuario.");
    }
  };


  return (
    <div className="flex flex-col bg-white border border-gray-300 rounded-xl shadow-2xl w-full h-[500px]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b bg-primary rounded-t-xl">
        <h3 className="text-lg font-bold text-white truncate">{matchName || "Chat"}</h3>
        <div className="flex space-x-2">
          <button 
            onClick={handleBlockUser}
            className="text-white p-1 rounded-full hover:bg-red-500/70 transition-colors"
            title="Bloquear usuario"
          >
            <Ban className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveChat(null)}
            className="text-white p-1 rounded-full hover:bg-blue-500/70 transition-colors"
            title="Cerrar chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CUERPO DE MENSAJES */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {isHistoryLoading ? (
          <div className="text-center text-gray-500">Cargando historial...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">¡Es un match! Comiencen la conversación.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-xl shadow-md 
                ${msg.senderId === currentUserId 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-black'}`}
              >
                {/* Lógica para mostrar imagen si existe */}
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Message image" 
                    className="rounded-md mb-2 max-w-full"
                  />
                )}
                {msg.content}
                <div className="text-xs mt-1 text-right" style={{ color: msg.senderId ===   currentUserId ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>
                  {msg.senderId === currentUserId && (
                    <span className="mr-1">
                      {/* Lógica de estado de lectura/envío */}
                      {msg.status === 'pending' ? '...' : (msg.readAt ? '✔✔' : '✔')}
                    </span>
                  )}
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      <div ref={messagesEndRef} />
      </div>

      {/* INPUT DE ENVÍO */}
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
            disabled={!inputContent.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <CornerDownLeft className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
export default MessageWindow;