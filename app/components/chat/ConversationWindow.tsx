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

const MESSAGES_PER_PAGE = 50;

// Usaremos esta interfaz para la información adicional del match
interface ConversationWindowProps {
  currentUserId: string;
  matchId: string; // ID del usuario con el que se está chateando
  matchName: string | null;
}

// Icono de Bloqueo (Círculo con línea)
const BlockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
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
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);
// Icono de Desbloqueo (Candado abierto)
const UnblockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const ConversationWindow: React.FC<ConversationWindowProps> = ({
  currentUserId,
  matchId,
  matchName,
}) => {
  const isChatExpanded = useChatStore((state) => state.isExpanded);
  const reloadMatches = React.useCallback(() => {}, []);

  // Obtenemos la función de envío
  const {
    sendMessage,
    deleteMessage: socketDeleteMessage,
    blockUser,
    unblockUser,
    markMessagesAsRead: socketMarkMessagesAsRead,
  } = useSocket(currentUserId, isChatExpanded, reloadMatches);

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
  const setHasMoreRef = useRef(setHasMore);

  // Aseguramos que la referencia del setter setHasMore esté actualizada
  useEffect(() => {
    setHasMoreRef.current = setHasMore;
  }, [setHasMore]);

  // --- Helper: merge/upsert messages into global store (dedupe by id/localId) ---
  const mergeMessages = useCallback(
    (incoming: MessageType[]) => {
      const existing = chatStoreGetState().messages || [];
      const map = new Map<string, MessageType>();

      // add existing messages (prefer earlier stored)
      for (const m of existing) {
        const key = m.id ?? m.localId;
        if (!key) continue;
        map.set(key, m);
      }

      
      // merge incoming (overwrite/complete fields)
      for (const m of incoming) {
        const key = m.id ?? m.localId;
        if (!key) continue;
        const prev = map.get(key);
        // prefer fields from incoming when available; preserve previous otherwise
        map.set(key, { ...(prev || {}), ...m });
      }

      // create sorted array (asc by createdAt)
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(merged);
    },
    [setMessages, chatStoreGetState]
  );

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

  const isOnline = useChatStore((state) => state.onlineUsers[matchId]); // <-- Este selector está bien porque devuelve un primitivo (boolean)

  // --- Manejador de Bloqueo/Desbloqueo ---
  const handleBlockUnblock = () => {
    if (isBlockedByMe) {
      unblockUser(matchId);
    } else {
      blockUser(matchId);
    }
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

  // --- Lógica de Envío con Pre-Subida (Cloudinary) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si está bloqueado por mí, no enviar.
    if (isBlockedByMe) {
      console.log("No se puede enviar: El usuario está bloqueado por mí.");
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
      if (
        isHistoryLoadingRef.current ||
        (!isInitialLoad && !hasMoreRef.current) ||
        !matchId
      )
        return;

      console.log(
        `[CHAT] Iniciando carga para Match ID: ${matchId}, Carga Inicial: ${isInitialLoad}`
      );
      // Actualizamos la referencia y el estado para la UI:
      isHistoryLoadingRef.current = true;
      setIsHistoryLoading(true);

      const { messages: currentMessages } = chatStoreGetState();

      // Filtramos para obtener solo los mensajes del match activo que SÍ tengan ID (o sea, guardados en DB)
      const activeMatchMessages = currentMessages.filter(
        (msg) =>
          ((msg.senderId === currentUserId && msg.receiverId === matchId) ||
            (msg.senderId === matchId && msg.receiverId === currentUserId)) &&
          msg.id // Solo mensajes que tienen ID de la DB
      );

      const lastMessageId = isInitialLoad
        ? ""
        : activeMatchMessages[0]?.id || "";

      const url = `/api/chat/history/${matchId}?lastMessageId=${lastMessageId}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          // Log para saber qué pasó si falla
          console.error(
            `[CHAT ERROR] Falló la API: ${response.status} ${response.statusText}`
          );
          throw new Error("Failed to load chat history");
        }

        const data = await response.json();
        const newMessages: MessageType[] = data.messages ?? [];
        setHasMoreRef.current = data.hasMore ?? false;
        hasMoreRef.current = data.hasMore ?? false;
        console.log(
          `[CHAT] Data recibida. Mensajes: ${newMessages.length}, HasMore: ${data.hasMore}`
        );

        if (isInitialLoad) {
          mergeMessages(newMessages);
        } else {
          // Carga subsiguiente (scroll infinito): añadimos al principio
          const existing = chatStoreGetState().messages || [];
          mergeMessages(newMessages.concat(existing));
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        // Establecemos hasMore a false en caso de error para detener reintentos de paginación
        if (!isInitialLoad) {
          setHasMoreRef.current(false);
          hasMoreRef.current = false;
        }
      } finally {
        isHistoryLoadingRef.current = false;
        setIsHistoryLoading(false);
        console.log(`[CHAT] Carga finalizada. isHistoryLoading: false`);
      }
    },
    [matchId, mergeMessages, chatStoreGetState, currentUserId]
  );

  // --- Efecto de Carga Inicial y Lectura de Mensajes ---
  useEffect(() => {
    const store = chatStoreGetState();
    setHasMore(true);
    hasMoreRef.current = true;

    loadHistory(true); // Iniciamos la carga

    // Cuando se abre el chat, marcamos los mensajes entrantes como leídos
    if (matchId) {
      markMessagesAsRead(matchId);
      socketMarkMessagesAsRead(matchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, loadHistory]);

  // 📌 Al abrir un chat → reset unread (ya lo hace tu store)
  useEffect(() => {
    setActiveChat(matchId);
    markMessagesAsRead(matchId);
  }, [matchId, setActiveChat, markMessagesAsRead]);

  // --- Efecto para el Scroll ---
  useEffect(() => {
    // Si estamos en la carga inicial, hacemos scroll al final
    if (messages.length > 0 && messages.length <= MESSAGES_PER_PAGE) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // Si estamos en una paginación (scroll infinito), ajustamos la posición
    if (messages.length > MESSAGES_PER_PAGE && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      // Ajustamos el scroll para compensar el contenido añadido
      scrollContainerRef.current.scrollTop =
        currentScrollHeight - lastScrollHeight.current;
    }

    // Guardamos la altura actual del scroll para la siguiente carga
    lastScrollHeight.current = scrollContainerRef.current?.scrollHeight || 0;
  }, [messages.length]);

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

  // ---- Borrar conversación (solo local).
  const handleDeleteConversation = () => {
    if (!matchId) return;
    if (!confirm("¿Borrar toda la conversación del chat?")) return;
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
    setOpenMessageMenuId(null);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-white shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-400 to-purple-600 text-white sticky top-0 z-50">
        <div className="flex items-center space-x-3">
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
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Botón menú header */}
          <div className="relative">
            <button
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              className="p-1 rounded-full hover:bg-white/20"
              title="Opciones"
            >
              <svg
                width="18"
                height="18"
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
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-montserrat"
                >
                  Eliminar conversación
                </button>
                <button
                  onClick={() => {
                    updateBlockStatus(matchId!, !isBlockedByMe);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 font-montserrat"
                >
                  {isBlockedByMe ? "Desbloquear" : "Bloquear usuario"}
                </button>
                <button
                  onClick={() => {
                    setActiveChat(null);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 font-montserrat"
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
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
          title="Cerrar"
        >
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Contenedor de Mensajes */}
      <div
        ref={scrollContainerRef}
        className="flex-grow overflow-y-auto p-4 flex flex-col space-y-3"
      >
        {isBlockedByMe && (
          <div className="text-center bg-red-100 text-red-700 p-2 rounded-lg text-sm mb-4">
            Has bloqueado a este usuario. Desbloquea para poder chatear de
            nuevo.
          </div>
        )}
        {isHistoryLoading && (
          <div className="text-center text-sm text-blue-500 py-2">
            Cargando historial...
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

          const messageClasses = `
    max-w-[75%] 
    p-3 
    rounded-xl 
    shadow-md 
    transition-all 
    duration-300 
    break-words 
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
          const deletedByOther = wasDeleted && !deletedForMe;

          return (
            <div
              key={msg.id || msg.localId}
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
                  {msg.content && (
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
                    <div className="absolute right-1 top-full mt-1 bg-white rounded-md shadow z-50 w-36">
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="font-montserrat w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        Eliminar mensaje
                      </button>
                    </div>
                  )}

                  {/* Horario */}
                  <div className="text-xs mt-1 text-right flex items-center justify-end space-x-1">
                    {isSender && (
                      <span className="text-blue-200">
                        {msg.status === "pending"
                          ? "..."
                          : msg.readAt
                          ? "✔✔"
                          : "✔"}
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
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envío */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex-shrink-0">
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
              X
            </button>
            <p className="text-xs text-gray-600 mt-1 truncate">
              {imageFile?.name}
            </p>
          </div>
        )}

        <div className="flex space-x-2 items-center">
          <label
            className={`cursor-pointer ${
              isUploading || isBlockedByMe ? "opacity-50" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading || isBlockedByMe}
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
                : "Escribe un mensaje..."
            }
            className="w-full resize-none border rounded-lg p-2 text-sm max-h-32 overflow-y-auto"
            disabled={isHistoryLoading || isUploading || isBlockedByMe}
          />

          <button
            type="submit"
            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
            disabled={
              (!inputContent.trim() && !imageFile) ||
              isHistoryLoading ||
              isUploading
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
