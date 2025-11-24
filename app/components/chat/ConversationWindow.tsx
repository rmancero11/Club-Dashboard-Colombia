'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/app/hooks/useSocket";
import { MessageType } from "@/app/types/chat";

const MESSAGES_PER_PAGE = 50;

// Usaremos esta interfaz para la información adicional del match 
interface ConversationWindowProps {
  currentUserId: string;
  matchId: string; // ID del usuario con el que se está chateando
  matchName: string | null;
}

// Renombrado de MessageWindow a ConversationWindow
const ConversationWindow: React.FC<ConversationWindowProps> = ({ currentUserId, matchId, matchName }) => {

  const isChatExpanded = useChatStore(state => state.isExpanded);
  
  // Obtenemos la función de envío
  const { sendMessage, deleteMessage, blockUser } = useSocket(currentUserId, isChatExpanded); 
  
  const rawMessages = useChatStore(state => state.messages);
  const rawMatches = useChatStore(state => state.matches);
  const chatStoreGetState = useChatStore.getState;

  const setActiveChat = useChatStore(state => state.setActiveChat);
  const markMessagesAsRead = useChatStore(state => state.markMessagesAsRead);
  const markMessageAsRead = useChatStore(state => state.markMessageAsRead);
  
  // Acciones de la store
  const setMessages = useChatStore(state => state.setMessages);
  // const { prependMessages } = useChatStore.getState();
  const prependMessages = useChatStore(state => state.prependMessages);

  // Estado local para la subida de imágenes
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

  // Estado local para la paginación
  const [inputContent, setInputContent] = useState('');
  const [ hasMore, setHasMore ] = useState(true);
  const [ isHistoryLoading, setIsHistoryLoading ] = useState(false);

  // Referencias para el scroll y Observador
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef(0);

  // --- Lógica de Filtrado de Mensajes (¡USAR useMemo!) ---
  const messages = useMemo(() => {
    return rawMessages
    .filter(msg => 
      // Debe ser un mensaje entre los dos usuarios
      ((msg.senderId === currentUserId && msg.receiverId === matchId) ||
      (msg.senderId === matchId && msg.receiverId === currentUserId))
      // Y NO debe haber sido eliminado por el usuario actual
      && !(msg.deletedBy && msg.deletedBy.includes(currentUserId))
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [rawMessages, currentUserId, matchId]); // <-- Dependencias: Solo recalcula si cambian estos valores

  // --- Lógica de Búsqueda de Detalles del Match (¡USAR useMemo!) ---
  const matchDetails = useMemo(() => {
    return rawMatches.find(m => m.id === matchId);
  }, [rawMatches, matchId]);

  const isOnline = useChatStore(state => state.onlineUsers[matchId]); // <-- Este selector está bien porque devuelve un primitivo (boolean)

  // --- Lógica de Manejo de Archivo ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Crear una URL temporal para la previsualización
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  // --- Lógica de Envío con Pre-Subida (Cloudinary) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // El mensaje debe tener contenido de texto O una imagen
        if (!inputContent.trim() && !imageFile) return;
        
        setIsUploading(true);
        let finalImageUrl: string | undefined = undefined;

        if (imageFile) {
            // 1. Subir la imagen a Cloudinary (o a tu servicio de almacenamiento)
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', 'chat_uploads'); // Usar tu preset de Cloudinary
            
            // Reemplaza esto con tu endpoint real de Cloudinary o tu propio API
            const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

            try {
                const uploadResponse = await fetch(CLOUDINARY_URL, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Image upload failed');
                }
                
                const data = await uploadResponse.json();
                finalImageUrl = data.secure_url; // URL de la imagen subida
            
            } catch (error) {
                console.error('Error uploading image:', error);
                setIsUploading(false);
                alert('No se pudo subir la imagen.');
                return; 
            }
        }

        // 2. Enviar mensaje a través del Socket
        sendMessage({
            receiverId: matchId,
            content: inputContent.trim() || '', // El contenido puede ser vacío si solo es una imagen
            imageUrl: finalImageUrl, // Pasamos la URL final
        });

        // 3. Limpiar estado
        setInputContent('');
        setImageFile(null);
        setImagePreviewUrl(null);
        setIsUploading(false);
    };

  // Logica de carga de Historial
  const loadHistory = useCallback(async (isInitialLoad: boolean = true) => {
    const { messages: currentMessages } = chatStoreGetState();
    if (isHistoryLoading || (!isInitialLoad && !hasMore) || !matchId) return;

    setIsHistoryLoading(true);

    const lastMessageId = isInitialLoad ? '' : currentMessages[0]?.id;
    const url = `/api/chat/${matchId}?lastMessageId=${lastMessageId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error ('Failed to load chat history');

      const data = await response.json();
      const newMessages: MessageType[] = data.messages;
      setHasMore(data.hasMore);

      if (isInitialLoad) {
        // Primera carga: reemplazamos el estado de mensajes
        setMessages(newMessages);
      } else {
        // Carga subsiguiente (scroll infinito): añadimos al principio
        prependMessages(newMessages);
      }

    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [matchId, isHistoryLoading, hasMore, setMessages, prependMessages, chatStoreGetState]); 

  // --- Efecto de Carga Inicial ---
  useEffect(() => {
    // Limpiamos los mensajes cada vez que cambia el matchId
    setMessages([]); 
    setHasMore(true); // Reiniciamos la paginación
    loadHistory(true); 

    // Cuando se abre el chat, marcamos los mensajes entrantes como leídos
    if (matchId) {
      markMessagesAsRead(matchId); 
    }

  }, [matchId, loadHistory, setMessages, markMessagesAsRead]);

  // --- Efecto para el Scroll ---
  useEffect(() => {
    // Si estamos en la carga inicial, hacemos scroll al final
    if (messages.length > 0 && messages.length <= MESSAGES_PER_PAGE) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Si estamos en una paginación (scroll infinito), ajustamos la posición
    if (messages.length > MESSAGES_PER_PAGE && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      // Ajustamos el scroll para compensar el contenido añadido
      scrollContainerRef.current.scrollTop = currentScrollHeight - lastScrollHeight.current;
    }
    
    // Guardamos la altura actual del scroll para la siguiente carga
    lastScrollHeight.current = scrollContainerRef.current?.scrollHeight || 0;

  }, [messages.length]);

  // --- Lógica de IntersectionObserver para Scroll Infinito ---
  useEffect(() => {
    if (!scrollContainerRef.current || !observerTargetRef.current || isHistoryLoading || !hasMore) return;

    // Callback del observador: si el elemento target entra en vista, cargamos más historia
    const observerCallback: IntersectionObserverCallback = (entries) => {
      const target = entries[0];
      // Si el target (el primer mensaje) está visible
      if (target.isIntersecting && messages.length > 0) {
        loadHistory(false);
      }
    };
    
    const observer = new IntersectionObserver(observerCallback, {
        root: scrollContainerRef.current, // Contenedor del scroll
        threshold: 0.1, // Disparar cuando el 10% del target es visible
    });

    observer.observe(observerTargetRef.current);

    return () => observer.disconnect();
  }, [loadHistory, isHistoryLoading, hasMore, messages.length]);
  
  // // Obtenemos el match completo para acceder a la info detallada
  // const matchDetails = useChatStore(state => state.matches.find(m => m.id === matchId));
  // const isOnline = useChatStore(state => state.onlineUsers[matchId]);

  return (
    <div className="flex flex-col w-96 h-[500px] bg-white rounded-xl shadow-2xl">
      {/* Encabezado */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          {/* Avatar del Match */}
          <div className="relative">
            <img
              src={matchDetails?.avatar || '/default-avatar.png'} // Usar avatar si está disponible
              alt={matchName || 'Match'}
              className="w-10 h-10 rounded-full object-cover"
            />
            {/* Indicador de Estado Online/Offline */}
            {isOnline && (
              <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold truncate">{matchName || 'Chat'}</h3>
            <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {isOnline ? 'En línea' : 'Desconectado'}
            </span>
          </div>
        </div>
        {/* Botón de Bloquear */}
        <button
            onClick={() => blockUser(matchId)}
            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Bloquear Usuario"
        >
            {/* Icono de Bloqueo */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
        </button>
        {/* Botón de Cerrar */}
        <button 
          onClick={() => setActiveChat(null)} 
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          {/* Icono de cerrar (X) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Contenedor de Mensajes */}
      <div 
        ref={scrollContainerRef} 
        className="flex-grow overflow-y-auto p-4 flex flex-col space-y-3"
      >
        {/* Indicador de Carga y Scroll Infinito */}
        {isHistoryLoading && (
            <div className="text-center text-sm text-blue-500 py-2">Cargando historial...</div>
        )}
        
        {!hasMore && (
            <div className="text-center text-xs text-gray-500 mt-2">Fin del historial</div>
        )}

        {messages.map((msg, index) => {
          // Si es el primer mensaje, le asignamos la ref para el IntersectionObserver
          const isObserverTarget = index === 0 && hasMore;

          const isSender = msg.senderId === currentUserId;
          const messageClasses = `max-w-[75%] p-3 rounded-xl shadow-md transition-all duration-300 ${
            isSender ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-gray-200 text-black self-start rounded-tl-none'
          }`;

          return (
            <div 
              key={msg.id || msg.localId} 
              className={`flex ${isSender ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div 
                className={messageClasses}
                ref={isObserverTarget ? observerTargetRef : null} // Asignamos la referencia al primer mensaje
              >
                {/* Contenido de Imagen */}
                {msg.imageUrl && (
                    <img 
                        src={msg.imageUrl} 
                        alt="Imagen enviada" 
                        className="max-w-full h-auto rounded-lg mb-2" 
                    />
                )}
                {/* Contenido de Texto */}
                {msg.content && <p>{msg.content}</p>}

                <div className="text-xs mt-1 text-right flex items-center justify-end space-x-1">
                  {/* Estado del mensaje (solo para el remitente) */}
                  {isSender && (
                    <span className={`text-xs ${isSender ? 'text-blue-200' : 'text-gray-500'}`}>
                      {msg.status === 'pending' ? '...' : (msg.readAt ? '✔✔' : '✔')}
                    </span>
                  )}
                  {/* Hora */}
                  <span className={`text-xs ${isSender ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envío */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        
        {/* VISTA PREVIA DE IMAGEN */}
        {imagePreviewUrl && (
            <div className="mb-3 relative max-w-[150px] border rounded-lg p-1 bg-gray-50">
                <img 
                    src={imagePreviewUrl} 
                    alt="Vista previa" 
                    className="max-w-full h-auto rounded-md"
                />
                {/* Botón para cancelar la imagen */}
                <button 
                    type="button" 
                    onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                    className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                >
                    X
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">
                    {imageFile?.name}
                </p>
            </div>
        )}
        
        <div className="flex space-x-2 items-end">
            
            {/* BOTÓN/INPUT DE ARCHIVO */}
            <label className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />
                <span className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0">
                    {/* Icono de Clip / Adjuntar */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7l-6 6M9 7l6 6M10 10l-4 4M14 10l4 4M15 7L9 13M9 7l6 6M10 10l-4 4M14 10l4 4"></path><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </span>
            </label>

            <input 
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-grow border rounded-full p-3 focus:ring-blue-500 focus:border-blue-500"
              disabled={isHistoryLoading || isUploading} // Deshabilitar si se está cargando el historial O si se está subiendo una imagen
            />
            
            <button 
              type="submit" 
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
              // Deshabilitado si no hay contenido de texto NI archivo, o si está cargando historial/subiendo imagen
              disabled={(!inputContent.trim() && !imageFile) || isHistoryLoading || isUploading} 
            >
              {/* Icono de Carga/Enviar */}
              {isUploading ? (
                  // Spinner si isUploading es true
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                  // Icono de Enviar
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationWindow;