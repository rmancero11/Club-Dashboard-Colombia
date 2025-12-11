"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/app/hooks/useSocket";
import { MessageType } from "@/app/types/chat";
import { useCountdown } from "@/app/hooks/useCountdown";
import Link from "next/link";

const MESSAGES_PER_PAGE = 50;

// Usaremos esta interfaz para la información adicional del match
interface ConversationWindowProps {
  currentUserId: string;
  matchId: string; // ID del usuario con el que se está chateando
  matchName: string | null;
}

//Formatea una fecha para mostrar el indicador de día (Hoy, Ayer, Lunes, o DD/MM/AAAA).
// @param dateStr La cadena de fecha (ISO string) del mensaje.
// @returns El string formateado.
const formatDateSeparator = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Calcular la diferencia en días
  const diffTime = today.getTime() - messageDay.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };

  if (diffDays === 0) {
    return "Hoy";
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays > 1 && diffDays <= 6) {
    // Días de la semana (Lunes, Martes...)
    const dayName = date.toLocaleDateString("es-ES", options);
    // Capitalizar la primera letra (si es necesario)
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  } else {
    // Si es más de 6 días, usar formato de fecha corta (DD/MM/AAAA)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
};

const ConversationWindow: React.FC<ConversationWindowProps> = ({
  currentUserId,
  matchId,
  matchName,
}) => {
  const isChatExpanded = useChatStore((state) => state.isExpanded);

  // Obtenemos la función de envío
  const {
    sendMessage,
    deleteMessage: socketDeleteMessage,
    blockUser,
    unblockUser,
    markMessagesAsRead: socketMarkMessagesAsRead,
  } = useSocket(currentUserId, isChatExpanded);

  const rawMessages = useChatStore((state) => state.messages);
  const rawMatches = useChatStore((state) => state.matches);
  const chatStoreGetState = useChatStore.getState;

  const setActiveChat = useChatStore((state) => state.setActiveChat);

  // Acciones de la store
  const setMessages = useChatStore((state) => state.setMessages);
  const prependMessages = useChatStore((state) => state.prependMessages);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const markMessagesAsRead = useChatStore((state) => state.markMessagesAsRead);
  const updateBlockStatus = useChatStore((state) => state.updateBlockStatus);

  // Estado local para la subida de imágenes
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Estado local para la paginación
  const [inputContent, setInputContent] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Inicializamos el contador de tiempo de espera
  const countdown = useCountdown(5);

  // menu state
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(
    null
  );

  // Referencias para el scroll y Observador
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef(0);
  // Usamos la Referencia para bloquear llamadas concurrentes
  const isHistoryLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Helper: calculo de preview (incluye mensajes eliminados)
  const computePreviewFromMessage = useCallback((msg?: MessageType | undefined) => {
    if (!msg) return "";
    const wasDeleted = Array.isArray(msg.deletedBy) && msg.deletedBy.length > 0;
    const deletedForMe = msg.deletedBy?.includes(currentUserId);

    if (wasDeleted) {
      return deletedForMe ? "Eliminaste este mensaje" : "Este mensaje fue eliminado";
    }
    if (msg.imageUrl) return "📷 Foto";
    if (msg.content && msg.content.trim().length > 0) return msg.content;
    return "";
  }, [currentUserId]);

  const updateMatchPreviewFromStore = useCallback((targetMatchId: string | undefined) => {
    if (!targetMatchId) return;
    const all = chatStoreGetState().messages || [];
    const chatMsgs = all
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === targetMatchId) ||
          (m.senderId === targetMatchId && m.receiverId === currentUserId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : undefined;
    const preview = computePreviewFromMessage(lastMsg);
    const lastAt = lastMsg?.createdAt ?? null;

    useChatStore.setState((state) => ({
      matches: state.matches.map((m) =>
        m.id === targetMatchId
          ? {
              ...m,
              lastMessageContent: preview || null,
              lastMessageAt: lastAt,
            }
          : m
      ),
    }));
  }, [chatStoreGetState, currentUserId, computePreviewFromMessage]);

  // --- Lógica de Filtrado de Mensajes ---
  const messages = useMemo(() => {
    return rawMessages
      .filter(
        (msg) =>
          // Debe ser un mensaje entre los dos usuarios
          (msg.senderId === currentUserId && msg.receiverId === matchId) ||
          (msg.senderId === matchId && msg.receiverId === currentUserId)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [rawMessages, currentUserId, matchId]); // <-- Dependencias: Solo recalcula si cambian estos valores

  // --- Lógica de Búsqueda de Detalles del Match y Estado de Bloqueo ---
  const matchDetails = useMemo(() => {
    return rawMatches.find((m) => m.id === matchId);
  }, [rawMatches, matchId]);

  const isBlockedByMe = matchDetails?.isBlockedByMe; // Estado de Bloqueo
  const isBlockedByOther = matchDetails?.isBlockedByOther; // Estado de Bloqueo por otro usuario

  const isOnline = useChatStore((state) => state.onlineUsers[matchId]); // <-- Este selector está bien porque devuelve un primitivo (boolean)

  // --- Manejador de Bloqueo/Desbloqueo ---
  const handleBlockUnblock = () => {
    
    if (!matchId) return;

    if (isBlockedByMe) {
      // Si yo ya lo bloqueé, la acción será desbloquear
      unblockUser(matchId);
    
    } else {
      // Si no, bloqueo
      blockUser(matchId);
    }
    setShowHeaderMenu(false);
  };

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

  // --- Lógica de Envío con Pre-Subida (Cloudinary) (Previene si bloqueo cualquiera de los dos sentidos) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si está bloqueado por mí o por otro, no enviar.
    if (isBlockedByMe || isBlockedByOther) {
      console.log("No se puede enviar: bloqueo activo (blockedByMe | blockedByOther).");
      return;
    }

    // El mensaje debe tener contenido de texto O una imagen
    if (!inputContent.trim() && !imageFile) return;

    setIsUploading(true);
    let finalImageUrl: string | undefined = undefined;

    if (imageFile) {
      // 1. Subir la imagen a nuestro endpoint local
      const formData = new FormData();
      formData.append("file", imageFile);

      const UPLOAD_URL = `/api/chat/upload-image`;

      try {
        const uploadResponse = await fetch(UPLOAD_URL, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          // Capturamos el error devuelto por la API
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Image upload failed");
        }

        const data = await uploadResponse.json();
        finalImageUrl = data.imageUrl; // URL de la imagen subida
      } catch (error) {
        console.error("Error uploading image:", error);
        setIsUploading(false);
        alert(`No se pudo subir la imagen: ${(error as Error).message}`);
        return;
      }
    }

    // 2. Enviar mensaje a través del Socket
    sendMessage({
      receiverId: matchId,
      content: inputContent.trim() || "", // El contenido puede ser vacío si solo es una imagen
      imageUrl: finalImageUrl, // Pasamos la URL final
    });

    // ACTUALIZAR EL MATCH EN LA STORE
    useChatStore.setState((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              lastMessageContent:
                inputContent.trim() || (finalImageUrl ? "📷 Foto" : ""),
              lastMessageAt: new Date().toISOString(),
            }
          : m
      ),
    }));

    // 3. Limpiar estado
    setInputContent("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setIsUploading(false);
  };

  // Logica de carga de Historial
  const loadHistory = useCallback(
    async (isInitialLoad: boolean = true) => {
      // 1. Evitar llamadas si ya está cargando o no hay ID
      if (isHistoryLoadingRef.current || !matchId) return;

      // 2. Si es paginación (scroll) y ya no hay más, salir.
      if (!isInitialLoad && !hasMoreRef.current) return;
      
      // Bloquear nuevas llamadas
      isHistoryLoadingRef.current = true;
      setIsHistoryLoading(true);

      // Guardamos la altura del scroll ANTES de cargar para ajustar después
      if (scrollContainerRef.current) {
        lastScrollHeight.current = scrollContainerRef.current.scrollHeight;
      }

      console.log(
        `[CHAT] Iniciando carga para Match ID: ${matchId}, Carga Inicial: ${isInitialLoad}`
      );

      
      try {
        let lastMessageId = "";
        
        // Si NO es carga inicial, buscamos el mensaje MÁS VIEJO (el primero de la lista)
        // para pedir los anteriores a ese.
        if (!isInitialLoad) {
          const { messages: currentMessages } = chatStoreGetState();
          // Filtramos solo los de este chat
          const chatMsgs = currentMessages.filter(
             m => (m.senderId === currentUserId && m.receiverId === matchId) || 
                  (m.senderId === matchId && m.receiverId === currentUserId)
          ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          // El más viejo es el primero (índice 0) y debe tener un ID de Prisma
          const oldestMessageWithId = chatMsgs.find(m => !!m.id);
          if (oldestMessageWithId) {
            lastMessageId = oldestMessageWithId.id;
          }

          // Si estamos paginando y no encontramos un mensaje con ID de Prisma para el cursor, salimos.
          if (!lastMessageId) {
            console.log("[CHAT] No hay mensaje con ID válido para usar como cursor.");
            isHistoryLoadingRef.current = false;
            setIsHistoryLoading(false);
            return;
          }
        }

        const url = `/api/chat/history/${matchId}?lastMessageId=${lastMessageId}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Failed");

        const data = await response.json();
        const newMessages: MessageType[] = data.messages ?? [];
        
        // Control de paginación
        const serverHasMore = data.hasMore ?? false;
        // Si no llegan mensajes, no hay más (evita bucles)
        const calculatedHasMore = newMessages.length > 0 && serverHasMore;

        hasMoreRef.current = calculatedHasMore;
        setHasMore(calculatedHasMore);

        if (isInitialLoad) {
          // Para la carga inicial, reemplazamos TODOS los mensajes de este chat
          // (Esto es clave para eliminar mensajes optimistas que no se guardaron,
          // o al menos los de la paginación inicial)
          // 1. Filtramos los mensajes de OTRAS conversaciones
          const otherChatMessages = chatStoreGetState().messages.filter(m => 
            !(m.senderId === currentUserId && m.receiverId === matchId) &&
            !(m.senderId === matchId && m.receiverId === currentUserId)
          );

          // 2. Combinamos con los mensajes del historial y establecemos el nuevo estado
          // Usamos `setMessages` para reemplazar el array completo, asegurando consistencia.
          // Como la API devuelve [Viejo...Nuevo], está listo para ser concatenado.
          setMessages([...otherChatMessages, ...newMessages]); 

          if (newMessages.length > 0) {
            const last = newMessages[newMessages.length - 1];
            const preview = computePreviewFromMessage(last);
            const lastAt = last.createdAt || new Date().toISOString();

            useChatStore.setState((state) => ({
              matches: state.matches.map((m) =>
                m.id === matchId ? { ...m, lastMessageContent: preview || null, lastMessageAt: lastAt } : m
              ),
            }));
          } else {
            updateMatchPreviewFromStore(matchId);
          }

        } else {
          
          prependMessages(newMessages);
          // cuando traemos más mensajes podemos recalcular preview por si el último cambió
          if (newMessages.length > 0) updateMatchPreviewFromStore(matchId);
        }

      } catch (error) {
        console.error("Error loading chat history:", error);
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        isHistoryLoadingRef.current = false;
        setIsHistoryLoading(false);
      }
    },
    [matchId, chatStoreGetState, currentUserId, setMessages, prependMessages, computePreviewFromMessage, updateMatchPreviewFromStore]
  );


  // --- Efecto de Carga Inicial ---
  useEffect(() => {
    // 1. Resetear estados al cambiar de match
    setHasMore(true); 
    hasMoreRef.current = true;
    
    const existingMessagesForChat = chatStoreGetState().messages.filter(
      (m) => (m.senderId === currentUserId && m.receiverId === matchId) ||
             (m.senderId === matchId && m.receiverId === currentUserId)
    );

    if (existingMessagesForChat.length > 0) {
      // usamos los mensajes preloaded; si quieres cargar historial completo al abrir, reemplaza la siguiente línea por loadHistory(true)
      // setHasMore(false); // opcional: si sólo trajimos 1 preview y no queremos cargar historial aún
      // aseguramos preview actualizado
      updateMatchPreviewFromStore(matchId);
    } else {
      loadHistory(true);
    }

    // 3. Marcar como leídos
    if (matchId) {
      markMessagesAsRead(matchId);
      socketMarkMessagesAsRead(matchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]); // 👈 Dependencia limpia: solo se ejecuta al cambiar de chat

  // 📌 Al abrir un chat → reset unread (ya lo hace tu store)
  useEffect(() => {
    setActiveChat(matchId);
    markMessagesAsRead(matchId);
  }, [matchId, setActiveChat, markMessagesAsRead]);


  // A. Scroll Inicial Automático (Solo baja al fondo si es la primera carga)
  useEffect(() => {
    // Si terminamos de cargar y NO hay historial previo (es la primera vez que entramos), bajamos.
    if (!isHistoryLoading && messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    
    // Mejor lógica simple: Si hay pocos mensajes (pantalla inicial), bajar.
    if (messages.length > 0 && messages.length <= MESSAGES_PER_PAGE && !isHistoryLoading) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  }, [matchId, isHistoryLoading, messages.length]); // Dependencia clave: matchId (al cambiar de chat)


  // B. Scroll de Paginación (Mantiene la posición al cargar mensajes viejos arriba)
  // Usamos useLayoutEffect para que ocurra ANTES de que el usuario vea el pintado
  React.useLayoutEffect(() => {
    // Solo ejecutamos si tenemos una altura previa guardada y NO estamos cargando
    if (scrollContainerRef.current && lastScrollHeight.current > 0 && !isHistoryLoading) {
      
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const diff = newScrollHeight - lastScrollHeight.current;

      // Si la altura creció (se agregaron mensajes arriba), ajustamos el scroll
      // para que el usuario visualmente se quede en el mismo mensaje.
      if (diff > 0) scrollContainerRef.current.scrollTop = diff;
      
      // Reseteamos para evitar ajustes en otros renders
      lastScrollHeight.current = 0;
    }
  }, [messages.length, isHistoryLoading]);

  // --- Lógica de IntersectionObserver para Scroll Infinito ---
  useEffect(() => {
    if (
      !scrollContainerRef.current ||
      !observerTargetRef.current ||
      isHistoryLoading ||
      !hasMore
    )
      return;

    // Callback del observador: si el elemento target entra en vista, cargamos más historia
    const observerCallback: IntersectionObserverCallback = (entries) => {
      const target = entries[0];
      // Si el target (el primer mensaje) está visible
      if (target.isIntersecting && messages.length > 0) loadHistory(false);
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: scrollContainerRef.current, // Contenedor del scroll
      threshold: 0.1, // Disparar cuando el 10% del target es visible
    });

    observer.observe(observerTargetRef.current);

    return () => observer.disconnect();
  }, [loadHistory, isHistoryLoading, hasMore, messages.length]);

  // ---- Borrar conversación (solo local).
  const handleDeleteConversation = () => {
    if (!matchId) return;
    if (!confirm("¿Borrar chat? Esto borrará todos los mensajes de la conversación.")) return;
    const currentMessages = chatStoreGetState().messages || [];
    const updated = currentMessages.map((msg) => {
      // si el mensaje pertenece a la conversación, marcamos como borrado por mí
      if (msg.senderId === matchId || msg.receiverId === matchId) {
        const existing = Array.isArray(msg.deletedBy)
          ? msg.deletedBy
          : msg.deletedBy
          ? [msg.deletedBy]
          : [];
        // evitar duplicados
        const newDeletedBy = existing.includes(currentUserId)
          ? existing
          : [...existing, currentUserId];
        return {
          ...msg,
          deletedBy: newDeletedBy,
          content: "",
          imageUrl: null,
        };
      }
      return msg;
    });
    
    setMessages(updated);
    updateMatchPreviewFromStore(matchId);
    setShowHeaderMenu(false);
  };

  // ---- Borrar mensaje individual
  // Lo marcamos localmente como eliminado para el user actual (soft delete)
  const handleDeleteMessage = (msgId?: string) => {
    if (!msgId) return;
    if (!confirm("¿Eliminar mensaje?")) return;

    socketDeleteMessage(msgId, matchId);

    // marcar localmente como eliminado para mí
    const currentMessages = chatStoreGetState().messages || [];
    const updated = currentMessages.map((msg) => {
      const idMatch =
        (msg.id && msg.id === msgId) || (msg.localId && msg.localId === msgId);
      if (idMatch) {
        const existing = Array.isArray(msg.deletedBy)
          ? msg.deletedBy
          : msg.deletedBy
          ? [msg.deletedBy]
          : [];
        const newDeletedBy = existing.includes(currentUserId)
          ? existing
          : [...existing, currentUserId];
        return {
          ...msg,
          deletedBy: newDeletedBy,
          content: "",
          imageUrl: null,
        };
      }
      return msg;
    });
    setMessages(updated);
    updateMatchPreviewFromStore(matchId);
    setOpenMessageMenuId(null);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white shadow-2xl relative right-0">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-400 to-purple-600 text-white sticky top-0 z-50">
        <Link
          href={`/dashboard-user/profile/${matchId}`} 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={matchDetails?.avatar || "/default-avatar.png"}
              alt={matchName || "Match"}
              className="w-10 font-montserrat h-10 rounded-full object-cover border-2 border-white"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-400 rounded-full ring-2 ring-white"></span>
            )}
          </div>

          <div>
            <h3 className=" font-montserrat text-lg font-semibold truncate">
              {matchName || "Chat"}
            </h3>
            <span
              className={`text-xs ${
                isOnline ? "text-green-200" : "text-red-200"
              }`}
            >
              {isOnline ? "En línea" : "Desconectado"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 ml-auto">
          {/* Botón menú header */}
          <div className="relative">
            <button
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              className="p-1 rounded-full hover:bg-white/20"
              title="Opciones"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg z-50">
                <button
                  onClick={handleDeleteConversation}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-100 font-montserrat border-b border-gray-200"
                >
                  Eliminar conversación
                </button>

                <button
                  onClick={() => {
                    // updateBlockStatus(matchId!, !isBlockedByMe);
                    // setShowHeaderMenu(false);
                    handleBlockUnblock()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-black hover:bg-red-100 font-montserrat border-b border-gray-200"
                >
                  {isBlockedByMe ? "Desbloquear" : "Bloquear usuario"}
                </button>

                <button
                  onClick={() => {
                    setActiveChat(null);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-black hover:bg-red-100 font-montserrat"
                >
                  Cerrar chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botón de Cerrar */}
        <button
          onClick={() => setActiveChat(null)}
          className="text-white hover:text-red-900 p-1 rounded-full hover:bg-gray-200 transition-colors"
          title="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Contenedor de Mensajes */}
      <div
        ref={scrollContainerRef}
        className="flex-grow p-4 flex flex-col space-y-3 overflow-y-auto overflow-x-hidden"
      >
        
        {isHistoryLoading && (
          <div className="text-center py-2 flex flex-col items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-purple-500 mb-2"></div>
              <p className="text-sm text-purple-600 font-semibold">
                Cargando historial de mensajes...
              </p>
              <p className="text-xs text-gray-500 mt-1">
              Espera: {countdown} segundos
            </p>
          </div>
        )}
        
        {!hasMore && (
          <div className="text-center text-xs text-gray-500 mt-2">
            Fin del historial
          </div>
        )}

        {messages.map((msg, index) => {
          const isObserverTarget = index === 0 && hasMore;
          const isSender = msg.senderId === currentUserId;
          // --- Lógica del Separador de Fecha ---
          let dateSeparator = null;
          const previousMsg = messages[index - 1];
          
          const currentCreatedDate = new Date(msg.createdAt);
          const currentCreatedIsoString = currentCreatedDate.toISOString();

          // Comprobar si es el primer mensaje o si la fecha es diferente al mensaje anterior
          if (index === 0 || !previousMsg) {
              // Primer mensaje siempre muestra separador
              dateSeparator = formatDateSeparator(currentCreatedIsoString);
          } else {
            // Comparamos el día del mensaje actual con el día del mensaje anterior
            // const currentDate = new Date(msg.createdAt);
            const previousCreatedDate = new Date(previousMsg.createdAt);

            // Normalizar a medianoche para comparar solo la fecha (día/mes/año)
            const currentDay = new Date(currentCreatedDate.getFullYear(), currentCreatedDate.getMonth(), currentCreatedDate.getDate()).getTime();
            const previousDay = new Date(previousCreatedDate.getFullYear(), previousCreatedDate.getMonth(), previousCreatedDate.getDate()).getTime();

            if (currentDay !== previousDay) {
              // Si el día es diferente, generamos el separador
              dateSeparator = formatDateSeparator(currentCreatedIsoString);
            }
          }

          const messageClasses = `
          max-w-[75%] 
          p-3 
          rounded-xl 
          shadow-md 
          transition-all 
          duration-300 
          break-all
          whitespace-pre-line
          ${
            isSender
              ? "bg-purple-500 text-white self-end rounded-br-none"
              : "bg-purple-100 text-purple-900 self-start rounded-tl-none"
          }
          relative
          `;
          const wasDeleted = Array.isArray(msg.deletedBy) && msg.deletedBy.length > 0;
          const deletedForMe = msg.deletedBy?.includes(currentUserId);
          // const deletedByOther = wasDeleted && !deletedForMe;

          return (
            <React.Fragment key={msg.id || msg.localId}>
              {/* Renderiza el Separador de Fecha si existe */}
              {dateSeparator && (
                <div className="flex justify-center my-4 sticky top-4 z-40 pointer-events-none">
                  <div className="bg-green-100/70 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-500 font-semibold shadow-md pointer-events-auto w-28 text-center">
                    {dateSeparator}
                  </div>
                </div>
              )}
              {/* Renderizado del Mensaje */}
              <div
                className={`flex ${
                  isSender ? "justify-end" : "justify-start"
                } w-full relative`}
              >
                {wasDeleted ? (
                  <div
                    className={`${messageClasses} flex items-center justify-center text-gray-400 italic`}
                  >
                    <div className="text-sm text-center px-2">
                      {deletedForMe
                        ? "Eliminaste este mensaje"
                        : "Este mensaje fue eliminado"}
                      <span className="block text-xs text-gray-300 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span> 
                    </div>
                  </div>
                ) : (
                  <div
                    className={messageClasses}
                    ref={isObserverTarget ? observerTargetRef : null}
                  >
                    {/* Imagen */}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Imagen enviada"
                        className="max-w-full h-auto rounded-lg mb-2"
                      />
                    )}

                    {/* Texto + botón */}
                    {(msg.content || msg.imageUrl) && (
                      <div className="flex items-start w-full relative">
                        <p className="flex-1">{msg.content}</p>

                        {isSender && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMessageMenuId(
                                openMessageMenuId === msg.id ? null : msg.id
                              );
                            }}
                            className="p-1 rounded-full hover:bg-white/20 ml-2 flex-shrink-0"
                            title="Opciones del mensaje"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="6" r="1" />
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="18" r="1" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Menú de eliminar mensaje */}
                    {openMessageMenuId === msg.id && (
                      <div className="absolute right-9 top-0 mt-1 bg-white rounded-md shadow z-50 w-36">
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="font-montserrat w-full text-center px-2 py-1 text-sm text-red-600 hover:bg-red-100 hover:text-red-900"
                        >
                          Eliminar mensaje
                        </button>
                      </div>
                    )}

                    {/* Check de leído de mensaje y Horario de envío */}
                    <div className="text-xs mt-1 text-right flex items-center justify-end space-x-1">
                    {isSender && (
                      <span
                        className={`flex items-center justify-center ${
                          msg.readAt ? "text-blue-300" : "text-purple-200"
                        }`}
                        title={
                          msg.status === "pending"
                            ? "Enviando..."
                            : msg.readAt
                            ? "Leído"
                            : "Enviado"
                        }
                      >
                        {/* 1. ÍCONO PENDIENTE (Reloj) */}
                        {msg.status === "pending" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        )}

                        {/* 2. ÍCONO ENVIADO (Un check) - Solo si NO está leído aún */}
                        {msg.status !== "pending" && !msg.readAt && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}

                        {/* 3. ÍCONO LEÍDO (Doble check) */}
                        {msg.readAt && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6 7 17l-5-5" />
                            <path d="m22 10-7.5 7.5L13 16" />
                          </svg>
                        )}
                      </span>
                    )}
                      <span
                        className={isSender ? "text-blue-200" : "text-gray-500"}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
        {/* Banner cuando YO bloqueé al otro */}
        {isBlockedByMe && (
          <div className="text-center bg-red-100 text-red-700 p-2 rounded-lg justify text-sm mb-4">
            Has bloqueado a este usuario. Desbloquea para poder chatear de
            nuevo.
          </div>
        )}

        {/* Banner cuando ME BLOQUEARON */}
        {isBlockedByOther && (
          <div className="text-center bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm mb-4">
            Este usuario te ha bloqueado. No podrás enviar mensajes hasta que te desbloquee.
          </div>
        )}

      {/* Input de Envío className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-400 to-purple-600 text-white sticky top-0 z-50"*/}
      <form onSubmit={handleSubmit} className="sticky bottom-0 bg-white p-4 border-t z-50">
        {imagePreviewUrl && (
          <div className="mb-3 relative max-w-[150px] border rounded-lg p-1 bg-gray-50">
            <img
              src={imagePreviewUrl}
              alt="Vista previa"
              className="max-w-full h-auto rounded-md"
            />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreviewUrl(null);
              }}
              className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
            >
             ❌
            </button>
            <p className="text-xs text-gray-600 mt-1 truncate">
              {imageFile?.name}
            </p>
          </div>
        )}

        <div className="flex space-x-2 items-center">
          <label
            className={`cursor-pointer ${
              isUploading || isBlockedByMe || isBlockedByOther ? "opacity-50" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading || isBlockedByMe || isBlockedByOther}
            />
            <span className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 7l-6 6M9 7l6 6M10 10l-4 4M14 10l4 4M15 7L9 13M9 7l6 6M10 10l-4 4M14 10l4 4"></path>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </span>
          </label>

          <textarea
            value={inputContent}
            onChange={(e) => {
              setInputContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(
                e.target.scrollHeight,
                120
              )}px`;
            }}
            placeholder={
              isBlockedByMe
              ? "Desbloquea para escribir..."
              : isBlockedByOther 
              ? "Este usuario te ha bloqueado."
              : "Escribe un mensaje..."
            }
            className="w-full resize-none border rounded-lg p-2 text-sm max-h-32 overflow-y-auto"
            disabled={isHistoryLoading || isUploading || isBlockedByMe || isBlockedByOther}
          />

          <button
            type="submit"
            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
            disabled={
              (!inputContent.trim() && !imageFile) ||
              isHistoryLoading ||
              isUploading ||
              isBlockedByMe ||
              isBlockedByOther
            }
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationWindow;
